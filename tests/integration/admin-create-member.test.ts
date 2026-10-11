import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createMemberAction } from '@/actions/admin-actions';
import bcrypt from 'bcryptjs';

describe('Admin Create Member Action', () => {
  let adminUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  });

  it('should reject creation if caller is not an ADMIN', async () => {
    const fakeNonAdminId = 'non-admin-user-id';
    const res = await createMemberAction(fakeNonAdminId, {
      fullName: 'Sinh Viên Mới',
      email: 'sinhvien01@nexus.hcmus.edu.vn',
      role: 'MEMBER',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Chỉ Quản trị viên (Admin) mới có quyền');
  });

  it('should allow admin to create a new member with default password', async () => {
    const email = `test-member-${Date.now()}@student.hcmus.edu.vn`;
    const res = await createMemberAction(adminUser.id, {
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

    // Verify password is default member123
    const created = await prisma.user.findUnique({ where: { id: res.user!.id } });
    const isMatch = await bcrypt.compare('member123', created!.passwordHash!);
    expect(isMatch).toBe(true);

    // Clean up
    await prisma.user.delete({ where: { id: res.user!.id } });
  });

  it('should reject creating a user with already existing email', async () => {
    const res = await createMemberAction(adminUser.id, {
      fullName: 'Trùng Lặp',
      email: adminUser.email,
      role: 'MEMBER',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('đã tồn tại');
  });
});
