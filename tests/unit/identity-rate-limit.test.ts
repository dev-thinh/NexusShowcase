import { expect, it, vi } from 'vitest';
const { query, execute } = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn(async (_sql: unknown) => 0) }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { $queryRaw: query, $executeRaw: execute } }));
import { consumeRateLimit } from '@/features/identity/server/rate-limit';
it('denies requests over the shared database count and returns its retry delay', async () => {
 query.mockResolvedValue([{ count: 11, retryAfterSeconds: 45 }]);
 expect(await consumeRateLimit({ scope: 'login', key: 'member', limit: 10, windowMs: 60_000 })).toEqual({ allowed: false, retryAfterSeconds: 45 });
});
it('allows requests within the shared count', async () => {
 query.mockResolvedValue([{ count: 1, retryAfterSeconds: 60 }]);
 expect(await consumeRateLimit({ scope: 'upload', key: 'member', limit: 10, windowMs: 60_000 })).toEqual({ allowed: true, retryAfterSeconds: 0 });
});
it('fails closed on storage errors', async () => {
 query.mockRejectedValue(new Error('database unavailable'));
 await expect(consumeRateLimit({ scope: 'login', key: 'member', limit: 10, windowMs: 60_000 })).rejects.toThrow('database unavailable');
});

it('performs bounded expiry-index cleanup excluding its own key before consuming a bucket', async () => {
 query.mockResolvedValue([{ count: 1, retryAfterSeconds: 60 }]);
 execute.mockClear();
 await consumeRateLimit({ scope: 'login', key: 'member', limit: 10, windowMs: 60_000 });
 expect(execute).toHaveBeenCalledOnce();
 const cleanup = execute.mock.calls[0][0] as unknown as { sql: string; values: unknown[] };
 expect(cleanup.sql).toContain('ORDER BY "resetAt"');
 expect(cleanup.sql).toContain('LIMIT 100');
 expect(cleanup.sql).toContain('FOR UPDATE SKIP LOCKED');
 expect(cleanup.sql).toContain('key <>');
 expect(cleanup.values).toEqual([query.mock.calls.at(-1)![0].values[0]]);
});
