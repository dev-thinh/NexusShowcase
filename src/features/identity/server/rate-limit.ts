import 'server-only';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';

/** Shared, fixed-window throttle. Database errors propagate so callers fail closed.
 * Keys are hashed to avoid persisting submitted identifiers. Every call removes
 * a bounded batch of expired buckets; expiry is also enforced atomically.
 */
export async function consumeRateLimit(input: { scope: string; key: string; limit: number; windowMs: number }): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!input.scope || !input.key || !Number.isSafeInteger(input.limit) || input.limit < 1 || !Number.isSafeInteger(input.windowMs) || input.windowMs < 1) throw new Error('Invalid rate limit configuration');
  const key = createHash('sha256').update(JSON.stringify([input.scope, input.key])).digest('hex');
  // The resetAt index bounds the scan. Lock selected rows before deletion so a
  // concurrent upsert cannot renew a bucket between selection and deletion.
  // Skip busy rows and our own key to avoid contending with active consumers.
  await prisma.$executeRaw(Prisma.sql`
    WITH expired AS (
      SELECT key FROM rate_limit_buckets
      WHERE "resetAt" <= statement_timestamp() AND key <> ${key}
      ORDER BY "resetAt"
      LIMIT 100
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM rate_limit_buckets AS buckets USING expired
    WHERE buckets.key = expired.key`);
  const [bucket] = await prisma.$queryRaw<Array<{ count: number; retryAfterSeconds: number }>>(Prisma.sql`
    INSERT INTO rate_limit_buckets (key, count, "resetAt")
    VALUES (${key}, 1, statement_timestamp() + ${input.windowMs} * interval '1 millisecond')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limit_buckets."resetAt" <= statement_timestamp() THEN 1 ELSE LEAST(rate_limit_buckets.count::bigint + 1, 2147483647)::integer END,
      "resetAt" = CASE WHEN rate_limit_buckets."resetAt" <= statement_timestamp() THEN statement_timestamp() + ${input.windowMs} * interval '1 millisecond' ELSE rate_limit_buckets."resetAt" END
    RETURNING count, GREATEST(1, ceil(extract(epoch FROM ("resetAt" - statement_timestamp()))))::integer AS "retryAfterSeconds"`);
  if (!bucket) throw new Error('Rate limit storage returned no bucket');
  return { allowed: bucket.count <= input.limit, retryAfterSeconds: bucket.count <= input.limit ? 0 : bucket.retryAfterSeconds };
}
