import { expect, it, vi } from 'vitest';
const query = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { $queryRaw: query } }));
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
