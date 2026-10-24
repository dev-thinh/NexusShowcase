import { updateUserRoleAction } from '@/features/identity/server/member-actions';
import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ actor: null as null | { id: string; role: 'ADMIN'; fullName: string; status: 'ACTIVE'; mustChangePassword: boolean } }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => session.actor }));
let admin: NonNullable<typeof session.actor>;
beforeAll(async () => {
  const user = await prisma.user.create({ data: { fullName: 'Only admin', email: 'only-admin@nexus.test', role: 'ADMIN', status: 'ACTIVE' } });
  admin = { id: user.id, role: 'ADMIN', fullName: user.fullName, status: 'ACTIVE', mustChangePassword: false };
});
it('rejects self demotion and preserves the last active administrator', async () => {
  session.actor = admin;
  expect(await updateUserRoleAction(admin.id, 'MEMBER')).toMatchObject({ success: false });
  expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).role).toBe('ADMIN');
});
it('does not let two administrators concurrently demote each other', async () => {
  const second = await prisma.user.create({ data: { fullName: 'Second admin', email: 'second-admin@nexus.test', role: 'ADMIN', status: 'ACTIVE' } });
  const { updateMemberRole } = await import('@/features/identity/server/member-commands');
  const results = await Promise.all([
    updateMemberRole(admin, { targetUserId: second.id, newRole: 'MEMBER' }),
    updateMemberRole({ ...admin, id: second.id }, { targetUserId: admin.id, newRole: 'MEMBER' }),
  ]);
  expect(results.filter(result => result.success)).toHaveLength(1);
  expect(await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE', deletedAt: null } })).toBe(1);
});
