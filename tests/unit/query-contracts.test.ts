import { getHomePublications, listMemberPublications, listPublications } from '@/features/publications/server/queries';
import { pageBounds } from '@/shared/lib/pagination';
import { beforeEach, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: db } }));
beforeEach(() => { vi.clearAllMocks(); db.count.mockResolvedValue(21); db.findMany.mockResolvedValue([]); });
it.each(['2oops', '-1', Infinity, '2.5', undefined])('rejects partial or invalid numeric page input %s', raw => {
  expect(pageBounds(raw, 21, 10)).toEqual({ page: 1, skip: 0, take: 10, totalPages: 3 });
});
it('clamps overflow and handles an empty result', () => {
  expect(pageBounds('999', 21, 10)).toEqual({ page: 3, skip: 20, take: 10, totalPages: 3 });
  expect(pageBounds(2, 0, 10)).toEqual({ page: 1, skip: 0, take: 10, totalPages: 1 });
});
it('uses the identical visibility filter for count and bounded card query', async () => {
  await listPublications({ authenticated: false, q: 'robot', sort: 'newest', page: '999', pageSize: 10 });
  const count = db.count.mock.calls[0][0], query = db.findMany.mock.calls[0][0];
  expect(query.where).toEqual(count.where);
  expect(query.where).toMatchObject({ status: 'PUBLISHED', visibility: 'PUBLIC' });
  expect(query).toMatchObject({ take: 10, skip: 20 });
  expect(query.select).not.toHaveProperty('content');
  expect(query.select).not.toHaveProperty('authorDraft');
});
it('limits home and member portfolio queries before hydration', async () => {
  await getHomePublications(false);
  expect(db.findMany.mock.calls[0][0]).toMatchObject({ take: 3, where: { status: 'PUBLISHED', visibility: 'PUBLIC' } });
  await listMemberPublications({ memberId: 'member', authenticated: true, type: 'PROJECT', page: 1 });
  expect(db.findMany.mock.calls[1][0]).toMatchObject({ take: 20, skip: 0, where: { status: 'PUBLISHED', type: 'PROJECT', contributors: { some: { userId: 'member' } } } });
});
