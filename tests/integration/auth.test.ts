import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

describe('Authentication & Credentials Verification', () => {
  it('should authenticate PGS.TS. Trần Minh Triết (ADMIN) with admin123456', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'tranminhtriet@fit.hcmus.edu.vn' },
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe('ADMIN');
    expect(user?.status).toBe('ACTIVE');

    const isMatch = await bcrypt.compare('admin123456', user!.passwordHash!);
    expect(isMatch).toBe(true);
  });

  it('should authenticate Nguyễn Hoàng Long (CORE_MEMBER) with member123456', async () => {
    const user = await prisma.user.findUnique({
      where: { email: '21120001@student.hcmus.edu.vn' },
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe('CORE_MEMBER');

    const isMatch = await bcrypt.compare('member123456', user!.passwordHash!);
    expect(isMatch).toBe(true);
  });

  it('should authenticate Phạm Thu Thảo (MEMBER) with member123456', async () => {
    const user = await prisma.user.findUnique({
      where: { email: '23120150@student.hcmus.edu.vn' },
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe('MEMBER');

    const isMatch = await bcrypt.compare('member123456', user!.passwordHash!);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'tranminhtriet@fit.hcmus.edu.vn' },
    });
    const isMatch = await bcrypt.compare('wrongpassword', user!.passwordHash!);
    expect(isMatch).toBe(false);
  });
});
