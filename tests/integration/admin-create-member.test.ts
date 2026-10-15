import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createMemberAction, updateUserRoleAction } from '@/actions/admin-actions';
import bcrypt from 'bcryptjs';

const currentUserMock = vi.hoisted(() => ({
  actor: null as {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'EDITOR' | 'CORE_MEMBER' | 'MEMBER';
    status: 'ACTIVE';
  } | null,
}));

vi.mock('@/lib/current-user', () => ({
  getCurrentUser: vi.fn(async (allowedRoles?: string[]) => {
    const actor = currentUserMock.actor;
    if (!actor || (allowedRoles && !allowedRoles.includes(actor.role))) return null;
    return actor;
  }),
}));

describe('Admin Create Member Action', () => {
  let adminUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
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
    expect(res.user).toBeDefined();
    expect(res.user?.fullName).toBe('Trần Văn Nam');
    expect(res.user?.role).toBe('CORE_MEMBER');
    expect(res.user?.status).toBe('ACTIVE');

    expect(res.temporaryPassword).toBeDefined();
    expect(res.temporaryPassword).not.toBe('member123');

    // Verify the one-time password returned to the admin matches the stored hash.
    const created = await prisma.user.findUnique({ where: { id: res.user!.id } });
    const isMatch = await bcrypt.compare(res.temporaryPassword!, created!.passwordHash!);
    expect(isMatch).toBe(true);

    // Clean up
    await prisma.user.delete({ where: { id: res.user!.id } });
  });

  it('should allow admin to assign and update EDITOR role through member management', async () => {
    currentUserMock.actor = adminUser;
    const email = `test-editor-${Date.now()}@student.hcmus.edu.vn`;
    const res = await createMemberAction({
      fullName: 'Lê Biên Tập Viên',
      email,
      role: 'EDITOR' as any,
    });

    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('EDITOR');

    const updateRes = await updateUserRoleAction(res.user!.id, 'CORE_MEMBER');
    expect(updateRes.success).toBe(true);
    expect(updateRes.user?.role).toBe('CORE_MEMBER');

    const updateBack = await updateUserRoleAction(res.user!.id, 'EDITOR');
    expect(updateBack.success).toBe(true);
    expect(updateBack.user?.role).toBe('EDITOR');

    await prisma.user.delete({ where: { id: res.user!.id } });
  });

  it('should reject creating a user with already existing email', async () => {
    currentUserMock.actor = adminUser;
    const res = await createMemberAction({
      fullName: 'Trùng Lặp',
      email: adminUser.email,
      role: 'MEMBER',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('đã tồn tại');
  });
});
