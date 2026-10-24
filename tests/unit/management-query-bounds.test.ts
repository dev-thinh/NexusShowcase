import { listAdminMembers } from '@/features/identity/server/member-queries';
import { listReviewQueue } from '@/features/review/server/queries';
import { expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ count: vi.fn().mockResolvedValue(41), findMany: vi.fn().mockResolvedValue([]), groupBy: vi.fn().mockResolvedValue([]), raw: vi.fn().mockResolvedValue([]) }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: db, showcaseItem: db, $queryRaw: db.raw } }));
it('hydrates at most twenty minimal member rows with the count filter', async () => {
  await listAdminMembers({ q: '', role: 'MEMBER', page: '999' });
  const query = db.findMany.mock.calls.at(-1)![0];
  expect(query).toMatchObject({ take: 20, skip: 40, where: { role: 'MEMBER' } });
  expect(query.where).toEqual(db.count.mock.calls.at(-1)![0].where);
  expect(query.select).not.toHaveProperty('password');
});
it('bounds the review queue and projects snapshot summaries without snapshot content', async () => {
  await listReviewQueue('2');
  const sql = db.raw.mock.calls.at(-1)![0];
  expect(sql.values).toEqual(expect.arrayContaining([20]));
  expect(sql.sql).toContain('LIMIT');
  expect(sql.sql).toContain("->>'title'");
  expect(sql.sql).not.toContain('SELECT *');
});
