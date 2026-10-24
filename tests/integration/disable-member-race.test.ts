import { disableMember, updateMemberRole } from '@/features/identity/server/member-commands';
import { beforeEach, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const barrier = vi.hoisted(() => ({ targetId: '', entered: () => {}, resume: Promise.resolve(), armed: false }));
vi.mock('@/server/db/prisma', async () => {
  const { prisma: database } = await import('../fixtures/database');
  return { prisma: database.$extends({ query: { user: { async findUnique({ args, query }) {
    const row = await query(args);
    if (barrier.armed && args.where.id === barrier.targetId) {
      barrier.armed = false;
      barrier.entered();
      await barrier.resume;
    }
    return row;
  } } } }) };
});
beforeEach(async () => { barrier.armed = false; await prisma.user.deleteMany(); });
async function users() {
  const admin = await prisma.user.create({ data: { email: 'disable-admin@nexus.test', fullName: 'Admin', role: 'ADMIN', status: 'ACTIVE' } });
  const member = await prisma.user.create({ data: { email: 'disable-member@nexus.test', fullName: 'Member', role: 'MEMBER', status: 'ACTIVE' } });
  return { admin: { id: admin.id, fullName: admin.fullName, role: 'ADMIN' as const, status: 'ACTIVE' as const, mustChangePassword: false }, member };
}
it('does not suspend a promoted last admin using a stale target-role read', async () => {
  const { admin, member } = await users();
  let release!: () => void;
  const entered = new Promise<void>(resolve => { barrier.entered = resolve; });
  barrier.resume = new Promise<void>(resolve => { release = resolve; });
  barrier.targetId = member.id; barrier.armed = true;
  const disabling = disableMember(admin, member.id);
  await entered;
  try {
    expect(await updateMemberRole(admin, { targetUserId: member.id, newRole: 'ADMIN' })).toMatchObject({ success: true });
    expect(await updateMemberRole({ ...admin, id: member.id }, { targetUserId: admin.id, newRole: 'MEMBER' })).toMatchObject({ success: true });
  } finally { release(); }
  expect(await disabling).toMatchObject({ success: false });
  expect(await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE', deletedAt: null } })).toBe(1);
});
it('rejects a disable command when the actor lost admin rights after authentication', async () => {
  const { admin, member } = await users();
  await prisma.user.update({ where: { id: admin.id }, data: { role: 'MEMBER' } });
  expect(await disableMember(admin, member.id)).toMatchObject({ success: false });
  expect((await prisma.user.findUniqueOrThrow({ where: { id: member.id } })).status).toBe('ACTIVE');
});
