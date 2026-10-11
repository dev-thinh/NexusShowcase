import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

describe('Authentication & Credentials Verification', () => {
  it('should authenticate admin01 (ADMIN) with admin123', async () => {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin01' },
          { email: 'admin01@nexus.hcmus.edu.vn' },
        ],
      },
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe('ADMIN');
    expect(user?.status).toBe('ACTIVE');

    const isMatch = await bcrypt.compare('admin123', user!.passwordHash!);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password for admin01', async () => {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin01' },
          { email: 'admin01@nexus.hcmus.edu.vn' },
        ],
      },
    });
    expect(user).toBeDefined();
    const isMatch = await bcrypt.compare('wrongpassword', user!.passwordHash!);
    expect(isMatch).toBe(false);
  });
});
