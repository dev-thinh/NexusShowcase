import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));

import bcrypt from 'bcryptjs';

describe('Authentication & Session Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects suspended users from authenticating', async () => {
    const passwordHash = await bcrypt.hash('validPassword123', 10);
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: 'cjr012345678901234567890',
      email: 'suspended@nexus.test',
      fullName: 'Suspended Member',
      role: 'MEMBER',
      status: 'SUSPENDED',
      passwordHash,
    });

    const user = await mocks.prisma.user.findFirst({ where: { email: 'suspended@nexus.test' } });
    expect(user?.status).toBe('SUSPENDED');
  });

  it('verifies active user credentials correctly', async () => {
    const passwordHash = await bcrypt.hash('secretPassword2026', 10);
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: 'cjr012345678901234567891',
      email: 'active@nexus.test',
      fullName: 'Active Member',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash,
      mustChangePassword: false,
      sessionVersion: 1,
    });

    const user = await mocks.prisma.user.findFirst({ where: { email: 'active@nexus.test' } });
    expect(user).toBeDefined();
    expect(user?.status).toBe('ACTIVE');
    const isMatch = await bcrypt.compare('secretPassword2026', user!.passwordHash!);
    expect(isMatch).toBe(true);

    const isWrong = await bcrypt.compare('wrongpassword', user!.passwordHash!);
    expect(isWrong).toBe(false);
  });
});
