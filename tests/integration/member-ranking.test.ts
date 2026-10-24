import { searchContributors } from '@/features/identity/server/member-search-action';
import { listDirectory } from '@/features/members/server/queries';
import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ allowed: true }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => session.allowed ? { id: 'admin', role: 'ADMIN', status: 'ACTIVE' } : null }));
let expected: string[];
beforeAll(async () => {
  const names = ['An', 'Án', 'Anh', 'Ân', 'Bình', 'Dang', 'Đặng', 'Nguyễn', 'Nguyễn'];
  const users = await Promise.all(names.map((fullName, index) => prisma.user.create({ data: { email: `ranking-${index}@nexus.test`, fullName, role: 'MEMBER', status: 'ACTIVE', studentId: 'secret-student', passwordHash: 'secret-hash' } })));
  await prisma.user.create({ data: { email: 'deleted-ranking@nexus.test', fullName: 'Excluded', role: 'MEMBER', status: 'ACTIVE', deletedAt: new Date() } });
  for (const [index, count, visibility] of [[0, 1, 'PUBLIC'], [1, 2, 'PRIVATE']] as const) {
    for (let run = 0; run < count; run++) await prisma.showcaseItem.create({ data: { title: 'Ranking item', slug: `${index}-${run}`, summary: '', creatorId: users[index].id, status: 'PUBLISHED', visibility, contributors: { create: { userId: users[index].id, role: 'CONTRIBUTOR' } } } });
  }
  expected = [...users].sort((a, b) => Number(b.id === users[0].id) - Number(a.id === users[0].id) || a.fullName.localeCompare(b.fullName, 'vi') || a.id.localeCompare(b.id)).map(user => user.id);
});
it('matches Vietnamese ranking, includes zero/private-only members and paginates in the database', async () => {
  const first = await listDirectory({ authenticated: false, role: 'MEMBER', page: 1, pageSize: 6 });
  const second = await listDirectory({ authenticated: false, role: 'MEMBER', page: 2, pageSize: 6 });
  expect(first.items).toHaveLength(6);
  expect(first.total).toBe(9);
  expect([...first.items, ...second.items].map(member => member.id)).toEqual(expected);
  expect(JSON.stringify(first.items)).not.toContain('secret-');
  const internal = await listDirectory({ authenticated: true, role: 'MEMBER', page: 1, pageSize: 6 });
  expect(internal.items[0].fullName).toBe('Án');
  expect(internal.items[0]._count.contributions).toBe(2);
});
it('searches accent-insensitively and returns only bounded name/id options', async () => {
  const result = await searchContributors({ q: 'nguyen', page: 1 });
  expect(result.success).toBe(true);
  if (!result.success) throw Error(result.error);
  expect(result.data.items).toHaveLength(2);
  expect(Object.keys(result.data.items[0]).sort()).toEqual(['fullName', 'id']);
  expect(result.data.pageSize).toBe(20);
  session.allowed = false;
  expect(await searchContributors({ q: '', page: 1 })).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
});
