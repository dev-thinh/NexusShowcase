import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createMemberAction, deleteMemberAction } from '@/actions/admin-actions';

describe('Admin Delete Member Action', () => {
  let adminUser: any;
  let testMember: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('No admin user found');

    const created = await (createMemberAction as any)(adminUser.id, {
      fullName: 'Nguyễn Sinh Viên Xóa',
      email: `delete-test-${Date.now()}@student.hcmus.edu.vn`,
      role: 'MEMBER',
    });
    testMember = created.user;
  });

  it('should reject deletion if caller is not an ADMIN', async () => {
    const fakeNonAdminId = 'non-admin-id';
    const res = await (deleteMemberAction as any)(fakeNonAdminId, testMember.id);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Chỉ Quản trị viên (Admin) mới có quyền');
  });

  it('should prevent admin from deleting their own account', async () => {
    const res = await (deleteMemberAction as any)(adminUser.id, adminUser.id);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Quản trị viên không thể tự xóa tài khoản của chính mình');
  });

  it('should prevent deleting another ADMIN account', async () => {
    // create a temporary second admin to test
    const tempAdmin = await prisma.user.create({
      data: {
        email: `temp-admin-${Date.now()}@nexus.hcmus.edu.vn`,
        fullName: 'Admin Phụ',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const res = await (deleteMemberAction as any)(adminUser.id, tempAdmin.id);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Không thể xóa tài khoản Quản trị viên');

    await prisma.user.delete({ where: { id: tempAdmin.id } });
  });

  it('should successfully delete a regular or core member', async () => {
    const res = await (deleteMemberAction as any)(adminUser.id, testMember.id);
    expect(res.success).toBe(true);
    expect(res.message).toContain('thành công');

    // Verify user no longer exists in database
    const found = await prisma.user.findUnique({ where: { id: testMember.id } });
    expect(found).toBeNull();
  });
});
