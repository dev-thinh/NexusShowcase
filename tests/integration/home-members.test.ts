import { beforeEach, expect, it } from 'vitest';
import { getHomeMembers } from '@/features/members/server/queries';
import { prisma } from '../fixtures/database';

beforeEach(async () => { await prisma.user.deleteMany(); });

async function populate(admins: number, core: number, members: number) {
  let index = 0;
  for (const [role, count] of [['ADMIN', admins], ['CORE_MEMBER', core], ['MEMBER', members]] as const) {
    await prisma.user.createMany({ data: Array.from({ length: count }, () => {
      const id = index++;
      return { id: `home-${id}`, fullName: `Member ${String(id).padStart(3, '0')}`, email: `home-${id}@nexus.test`, passwordHash: 'not-public', role, status: 'ACTIVE' as const };
    }) });
  }
}

it('shows all eligible people below the cap without exposing profile or private fields', async () => {
  await populate(2, 12, 5);
  await prisma.user.createMany({ data: [
    { fullName: 'Disabled', email: 'disabled@nexus.test', passwordHash: '', role: 'ADMIN', status: 'SUSPENDED' },
    { fullName: 'Deleted', email: 'deleted@nexus.test', passwordHash: '', role: 'MEMBER', status: 'ACTIVE', deletedAt: new Date() },
    { fullName: 'Guest', email: 'guest@nexus.test', passwordHash: '', role: 'GUEST', status: 'ACTIVE' },
  ] });
  const result = await getHomeMembers();
  expect(result.total).toBe(19);
  expect(result.members).toHaveLength(19);
  expect(result.members.slice(0, 2).every(member => member.role === 'ADMIN')).toBe(true);
  for (const member of result.members) expect(Object.keys(member).sort()).toEqual(['avatarUrl', 'fullName', 'id', 'role']);
});

it('samples within roles per request, keeps admins and limits returned avatars to twenty-nine', async () => {
  await populate(3, 18, 50);
  const seen = new Set<string>();
  for (let run = 0; run < 4; run++) {
    const { total, members } = await getHomeMembers();
    expect(total).toBe(71);
    expect(members).toHaveLength(29);
    expect(new Set(members.map(member => member.id)).size).toBe(29);
    expect(members.slice(0, 3).map(member => member.id)).toEqual(['home-0', 'home-1', 'home-2']);
    expect(members.slice(3, 13).every(member => member.role === 'CORE_MEMBER')).toBe(true);
    expect(members.slice(13).every(member => member.role === 'MEMBER')).toBe(true);
    seen.add(members.map(member => member.id).join(','));
  }
  expect(seen.size).toBeGreaterThan(1);
});

it('fills remaining positions from members when the core group is small', async () => {
  await populate(1, 2, 40);
  const result = await getHomeMembers();
  expect(result.members).toHaveLength(29);
  expect(result.members.filter(member => member.role === 'MEMBER')).toHaveLength(26);
});

it('handles an empty directory', async () => {
  expect(await getHomeMembers()).toEqual({ members: [], total: 0 });
});
