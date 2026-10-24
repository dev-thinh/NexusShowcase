import { createMemberAction, updateUserRoleAction } from '@/features/identity/server/member-actions';
import bcrypt from 'bcryptjs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';

const currentUserMock = vi.hoisted(() => ({
  actor: null as {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'EDITOR' | 'CORE_MEMBER' | 'MEMBER';
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

describe('Admin Create Member Action', () => {
  let adminUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.create({ data: { fullName: 'Create member admin', email: 'create-admin@nexus.test', role: 'ADMIN', status: 'ACTIVE' } });
  });

  it('should reject creation if caller is not an ADMIN', async () => {
    const fakeNonAdminId = 'non-admin-user-id';
    currentUserMock.actor = {
      id: fakeNonAdminId,
      fullName: 'Non-admin member',
      role: 'MEMBER',
      status: 'ACTIVE',
    };
    const res = await createMemberAction({
      fullName: 'Sinh Viên Mới',
      email: 'sinhvien01@nexus.hcmus.edu.vn',
      role: 'MEMBER',
    });
    expect(res.success).toBe(false);
    if (res.success) throw Error('Expected failure');
    expect(res.error).toContain('Chỉ Quản trị viên (Admin) mới có quyền');
  });

  it('should allow admin to create a new member with a generated temporary password', async () => {
    currentUserMock.actor = adminUser;
    const email = `test-member-${Date.now()}@student.hcmus.edu.vn`;
    const res = await createMemberAction({
      fullName: 'Trần Văn Nam',
      email,
      studentId: '22120999',
      role: 'CORE_MEMBER',
    });

    expect(res.success).toBe(true);
    if (!res.success) throw Error(res.error);
    expect(res.data.user).toBeDefined();
    expect(res.data.user?.fullName).toBe('Trần Văn Nam');
    expect(res.data.user?.role).toBe('CORE_MEMBER');
    expect(res.data.user?.status).toBe('ACTIVE');

    expect(res.data.temporaryPassword).toBeDefined();
    expect(res.data.temporaryPassword).not.toBe('member123');

    // Verify the one-time password returned to the admin matches the stored hash.
    const created = await prisma.user.findUnique({ where: { id: res.data.user!.id } });
    const isMatch = await bcrypt.compare(res.data.temporaryPassword!, created!.passwordHash!);
    expect(isMatch).toBe(true);

    // Clean up
    await prisma.user.delete({ where: { id: res.data.user!.id } });
  });

  it('rejects creating or granting the retired EDITOR role', async () => {
    currentUserMock.actor = adminUser;
    const email = `test-author-${Date.now()}@student.hcmus.edu.vn`;
    const rejected = await createMemberAction({ fullName: 'Tác giả', email, role: 'EDITOR' as any });
    expect(rejected.success).toBe(false);
    const created = await createMemberAction({ fullName: 'Tác giả', email, role: 'CORE_MEMBER' });
    expect(created.success).toBe(true);
    if (!created.success) throw Error(created.error);
    try {
      expect((await updateUserRoleAction(created.data.user!.id, 'EDITOR')).success).toBe(false);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: created.data.user!.id } })).role).toBe('CORE_MEMBER');
    } finally { await prisma.user.delete({ where: { id: created.data.user!.id } }); }
  });

  it('should reject creating a user with already existing email', async () => {
    currentUserMock.actor = adminUser;
    const res = await createMemberAction({
      fullName: 'Trùng Lặp',
      email: adminUser.email,
      role: 'MEMBER',
    });

    expect(res.success).toBe(false);
    if (res.success) throw Error('Expected failure');
    expect(res.error).toContain('đã tồn tại');
  });
});
