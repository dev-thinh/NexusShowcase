import { searchContributors } from '@/features/identity/server/member-search-action';
import { selectedContributors } from '@/features/identity/server/selected-contributors';
import { listDirectory, listLeadershipDirectory } from '@/features/members/server/queries';
import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ allowed: true }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => session.allowed ? { id: 'admin', role: 'ADMIN', status: 'ACTIVE' } : null }));
let expected: string[];
beforeAll(async () => {
  const names = ['An', 'Án', 'Anh', 'Ân', 'Bình', 'Dang', 'Đặng', 'Nguyễn', 'Nguyễn'];
  const users = await Promise.all(names.map((fullName, index) => prisma.user.create({ data: { email: `ranking-${index}@nexus.test`, fullName, role: 'MEMBER', status: 'ACTIVE', studentId: 'secret-student', passwordHash: 'secret-hash' } })));
  await prisma.user.create({ data: { email: 'hidden-ranking@nexus.test', fullName: 'Nguyễn Hidden Admin', role: 'ADMIN', status: 'ACTIVE', hiddenFromDirectory: true } });
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

it('clamps stale page parameters within bounded directory pages', async () => {
  const result = await listDirectory({ authenticated: false, role: 'MEMBER', page: 999, pageSize: 12 });
  expect(result.items.map(member => member.id)).toEqual(expected);
  expect(result.page).toBe(1);
  expect(result.totalPages).toBe(1);
  expect(JSON.stringify(result.items)).not.toContain('secret-');
});

it('excludes hidden admins from empty/name searches, counts and selected contributor hydration', async () => {
  session.allowed = true;
  const hidden = await prisma.user.findUniqueOrThrow({ where: { email: 'hidden-ranking@nexus.test' } });
  for (const q of ['', 'nguyen', 'Hidden Admin']) {
    const result = await searchContributors({ q, page: 1 });
    if (!result.success) throw Error(result.error);
    expect(result.data.items.some(member => member.id === hidden.id)).toBe(false);
    expect(result.data.total).toBe(q === '' ? 9 : q === 'nguyen' ? 2 : 0);
  }
  expect(await selectedContributors([hidden.id])).toEqual([]);
});

it('returns only twelve rows per directory batch for larger groups', async () => {
  await prisma.user.createMany({ data: Array.from({ length: 25 }, (_, index) => ({ email: `bounded-${index}@nexus.test`, fullName: `Bounded ${String(index).padStart(2, '0')}`, role: 'CORE_MEMBER' as const, status: 'ACTIVE' as const })) });
  try {
    const leadership = await listLeadershipDirectory({ authenticated: false, role: 'CORE_MEMBER' });
    expect(leadership).toHaveLength(25);
    const pages = await Promise.all([1, 2, 3].map(page => listDirectory({ authenticated: false, role: 'CORE_MEMBER', page, pageSize: 12 })));
    expect(pages.map(page => page.items.length)).toEqual([12, 12, 1]);
    expect(pages.map(page => page.totalPages)).toEqual([3, 3, 3]);
    const members = pages.flatMap(page => page.items);
    expect(new Set(members.map(member => member.id)).size).toBe(25);
    expect(members.map(member => member.fullName)).toEqual(Array.from({ length: 25 }, (_, index) => `Bounded ${String(index).padStart(2, '0')}`));
  } finally {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'bounded-' } } });
  }
});
