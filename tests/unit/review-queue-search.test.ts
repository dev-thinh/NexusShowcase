import { beforeEach, expect, it, vi } from 'vitest';
import { listReviewQueue } from '@/features/review/server/queries';
const db = vi.hoisted(() => ({ count: vi.fn(), raw: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: { count: db.count }, $queryRaw: db.raw } }));
beforeEach(() => { vi.clearAllMocks(); db.count.mockResolvedValue(30); db.raw.mockResolvedValue([]); });
it('preserves bounded pagination without a search', async () => {
  const result = await listReviewQueue('2');
  expect(result).toMatchObject({ total: 30, page: 2, totalPages: 2 });
  expect(db.raw.mock.calls[0][0].values.slice(-2)).toEqual([20, 20]);
});
it('searches submitted titles and authors with bound parameters and counts the same filtered queue', async () => {
  db.raw.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([{ id: 'submission', title: 'Robot' }]);
  const result = await listReviewQueue('999', ' Robot ');
  expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
  expect(db.count).not.toHaveBeenCalled();
  const count = db.raw.mock.calls[0][0], items = db.raw.mock.calls[1][0];
  expect(count.sql).toContain('title ILIKE'); expect(count.sql).toContain('"creatorName" ILIKE');
  expect(count.values).toEqual(['%Robot%', '%Robot%']);
  expect(items.values).toEqual(['%Robot%', '%Robot%', 20, 0]);
});
