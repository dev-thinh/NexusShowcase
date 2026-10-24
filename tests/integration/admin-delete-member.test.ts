import { createMemberAction, deleteMemberAction } from '@/features/identity/server/member-actions';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';

const currentUserMock = vi.hoisted(() => ({
  actor: null as {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'CORE_MEMBER' | 'MEMBER';
    status: 'ACTIVE';
  } | null,
}));

vi.mock('@/features/identity/server/actor', () => ({
  getActor: vi.fn(async (allowedRoles?: string[]) => {
    const actor = currentUserMock.actor;
    if (!actor || (allowedRoles && !allowedRoles.includes(actor.role))) return null;
    return actor;
  }),
}));

describe('Admin Delete Member Action', () => {
  let adminUser: any;
  let testMember: any;

  beforeAll(async () => {
    adminUser = await prisma.user.create({ data: { fullName: 'Delete member admin', email: 'delete-admin@nexus.test', role: 'ADMIN', status: 'ACTIVE' } });

    currentUserMock.actor = adminUser;
    const created = await createMemberAction({
      fullName: 'Nguyễn Sinh Viên Xóa',
      email: `delete-test-${Date.now()}@student.hcmus.edu.vn`,
      role: 'MEMBER',
    });
    if (!created.success) throw Error(created.error);
    testMember = created.data.user;
  });

  it('should reject deletion if caller is not an ADMIN', async () => {
    const fakeNonAdminId = 'non-admin-id';
    currentUserMock.actor = {
      id: fakeNonAdminId,
      fullName: 'Non-admin member',
      role: 'MEMBER',
      status: 'ACTIVE',
    };
    const res = await deleteMemberAction(testMember.id);
    expect(res.success).toBe(false);
    if (res.success) throw Error('Expected failure');
    expect(res.error).toContain('Chỉ Quản trị viên (Admin) mới có quyền');
  });

  it('should prevent admin from deleting their own account', async () => {
    currentUserMock.actor = adminUser;
    const res = await deleteMemberAction(adminUser.id);
    expect(res.success).toBe(false);
    if (res.success) throw Error('Expected failure');
    expect(res.error).toContain('Quản trị viên không thể tự xóa tài khoản của chính mình');
  });

  it('should prevent deleting another ADMIN account', async () => {
    currentUserMock.actor = adminUser;
    // create a temporary second admin to test
    const tempAdmin = await prisma.user.create({
      data: {
        email: `temp-admin-${Date.now()}@nexus.hcmus.edu.vn`,
        fullName: 'Admin Phụ',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const res = await deleteMemberAction(tempAdmin.id);
    expect(res.success).toBe(false);
    if (res.success) throw Error('Expected failure');
    expect(res.error).toContain('Không thể xóa tài khoản Quản trị viên');

    await prisma.user.delete({ where: { id: tempAdmin.id } });
  });

  it('should suspend a regular or core member and revoke existing sessions', async () => {
    currentUserMock.actor = adminUser;
    const res = await deleteMemberAction(testMember.id);
    expect(res.success).toBe(true);
    if (!res.success) throw Error(res.error);
    expect(res.data.message).toContain('thành công');

    // The record remains for attribution and audit history.
    const found = await prisma.user.findUnique({ where: { id: testMember.id } });
    expect(found?.status).toBe('SUSPENDED');
    expect(found?.deletedAt).not.toBeNull();
    expect(found?.sessionVersion).toBeGreaterThan(1);

    await prisma.user.delete({ where: { id: testMember.id } });
  });
});
