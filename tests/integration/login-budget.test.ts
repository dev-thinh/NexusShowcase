import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { consumeRateLimit } from '@/features/identity/server/rate-limit';

it('cleans at most 100 expired buckets per call while preserving the active key and live buckets', async () => {
 const key = createHash('sha256').update(JSON.stringify(['cleanup-test', 'active'])).digest('hex');
 await prisma.rateLimitBucket.createMany({ data: [
   ...Array.from({ length: 150 }, (_, i) => ({ key: `expired-${i}`, count: 1, resetAt: new Date(0) })),
   { key, count: 100, resetAt: new Date(0) },
   { key: 'live-bucket', count: 1, resetAt: new Date(Date.now() + 600_000) },
 ] });
 expect((await consumeRateLimit({ scope: 'cleanup-test', key: 'active', limit: 1, windowMs: 60_000 })).allowed).toBe(true);
 expect(await prisma.rateLimitBucket.count({ where: { key: { startsWith: 'expired-' } } })).toBe(50);
 expect(await prisma.rateLimitBucket.findUnique({ where: { key: 'live-bucket' } })).not.toBeNull();
 expect(await prisma.rateLimitBucket.findUnique({ where: { key } })).toMatchObject({ count: 1 });
});
