import { listAuthorItems } from '@/features/submissions/server/queries';
import { beforeEach, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: db } }));
beforeEach(() => { vi.clearAllMocks(); db.count.mockResolvedValue(41); db.findMany.mockResolvedValue([]); });
it('bounds author hydration and uses the same ownership and workflow filter for count', async () => {
  await listAuthorItems({ actor: { id: 'author', fullName: 'Author', role: 'CORE_MEMBER', status: 'ACTIVE', mustChangePassword: false }, filter: 'PENDING_REVIEW', q: '', page: '999' });
  const query = db.findMany.mock.calls[0][0];
  expect(query).toMatchObject({ take: 20, skip: 40, where: { creatorId: 'author' } });
  expect(query.where).toEqual(db.count.mock.calls[0][0].where);
  expect(query.select).not.toHaveProperty('content');
  expect(query.orderBy.at(-1)).toEqual({ id: 'asc' });
});
