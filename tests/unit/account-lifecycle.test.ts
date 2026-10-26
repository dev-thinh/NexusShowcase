import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    $queryRaw: vi.fn(async () => []),
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/features/identity/server/auth', () => ({ auth: mocks.auth }));
vi.mock('@/features/identity/server/rate-limit', () => ({ consumeRateLimit: vi.fn(async () => ({ allowed: true, retryAfterSeconds: 0 })) }));
vi.mock('@/server/db/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('server-only', () => ({}));

import { changePasswordAction } from '@/features/identity/server/account-actions';
import {
createMemberAction,
deleteMemberAction,
updateUserRoleAction,
} from '@/features/identity/server/member-actions';
import bcrypt from 'bcryptjs';

const VALID_ADMIN_CUID = 'cjr012345678901234567890';
const VALID_MEMBER_CUID = 'cjr012345678901234567891';

describe('Account Lifecycle & Session State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(callback => callback({ user: mocks.prisma.user, $queryRaw: mocks.prisma.$queryRaw }));
  });

  describe('createMemberAction', () => {
    it('creates a new member with mustChangePassword, sessionVersion 1, and a unique temporary password without using member123', async () => {
      mocks.auth.mockResolvedValue({ user: { id: VALID_ADMIN_CUID, role: 'ADMIN' } });
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: VALID_ADMIN_CUID,
        fullName: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      mocks.prisma.user.findFirst.mockResolvedValue(null);
      mocks.prisma.user.create.mockImplementation(async ({ data }) => ({
        id: VALID_MEMBER_CUID,
        fullName: data.fullName,
        role: data.role,
        status: data.status,
      }));

      const result = await createMemberAction({
        fullName: 'Nguyễn Văn Test',
        email: 'test.member@nexus.edu.vn',
        role: 'MEMBER',
      });

      expect(result.success).toBe(true);
    if (!result.success) throw Error(result.error);
      expect(result.data.temporaryPassword).toBeDefined();
      expect(result.data.temporaryPassword).not.toBe('member123');
      expect(result.data.temporaryPassword.length).toBeGreaterThanOrEqual(8);

      expect(mocks.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullName: 'Nguyễn Văn Test',
            email: 'test.member@nexus.edu.vn',
            mustChangePassword: true,
            sessionVersion: 1,
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('deleteMemberAction (Soft delete)', () => {
    it('suspends and soft-deletes member without deleting record from database', async () => {
      mocks.auth.mockResolvedValue({ user: { id: VALID_ADMIN_CUID, role: 'ADMIN' } });
      mocks.prisma.user.findUnique.mockImplementation(async ({ where }) => ({
        id: where.id, fullName: where.id === VALID_ADMIN_CUID ? 'Admin User' : 'Target Member',
        role: where.id === VALID_ADMIN_CUID ? 'ADMIN' : 'MEMBER', status: 'ACTIVE', deletedAt: null,
      }));
      mocks.prisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await deleteMemberAction(VALID_MEMBER_CUID);

      expect(result.success).toBe(true);
    if (!result.success) throw Error(result.error);
      expect(mocks.prisma.user.delete).not.toHaveBeenCalled();
      expect(mocks.prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: VALID_MEMBER_CUID, role: { not: 'ADMIN' } }),
          data: expect.objectContaining({
            status: 'SUSPENDED',
            deletedAt: expect.any(Date),
            sessionVersion: { increment: 1 },
          }),
        })
      );
    });
  });

  describe('updateUserRoleAction', () => {
    it('increments sessionVersion when user role is updated to revoke stale sessions', async () => {
      mocks.auth.mockResolvedValue({ user: { id: VALID_ADMIN_CUID, role: 'ADMIN' } });
      mocks.prisma.user.findUnique.mockImplementation(async ({ where }) => ({
        id: where.id, fullName: 'Active account', role: where.id === VALID_ADMIN_CUID ? 'ADMIN' : 'MEMBER', status: 'ACTIVE',
      }));
      mocks.prisma.user.update.mockResolvedValue({
        id: VALID_MEMBER_CUID,
        fullName: 'Target Member',
        role: 'CORE_MEMBER',
        status: 'ACTIVE',
      });

      const result = await updateUserRoleAction(VALID_MEMBER_CUID, 'CORE_MEMBER');

      expect(result.success).toBe(true);
    if (!result.success) throw Error(result.error);
      expect(mocks.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_MEMBER_CUID },
          data: expect.objectContaining({
            role: 'CORE_MEMBER',
            sessionVersion: { increment: 1 },
          }),
        })
      );
    });
  });

  describe('changePasswordAction', () => {
    it('verifies current password, updates to new password, clears mustChangePassword and increments sessionVersion', async () => {
      const oldHash = await bcrypt.hash('tempSecret123', 10);
      mocks.auth.mockResolvedValue({ user: { id: VALID_MEMBER_CUID, role: 'MEMBER' } });
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: VALID_MEMBER_CUID,
        passwordHash: oldHash,
        status: 'ACTIVE',
      });

      mocks.prisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await changePasswordAction({
        currentPassword: 'tempSecret123',
        newPassword: 'newStrongPassword2026!',
      });

      expect(result.success).toBe(true);
    if (!result.success) throw Error(result.error);
      expect(mocks.prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: VALID_MEMBER_CUID, passwordHash: oldHash, status: 'ACTIVE', deletedAt: null }),
          data: expect.objectContaining({
            mustChangePassword: false,
            sessionVersion: { increment: 1 },
          }),
        })
      );
    });

    it('rejects incorrect current password', async () => {
      const oldHash = await bcrypt.hash('correctPassword', 10);
      mocks.auth.mockResolvedValue({ user: { id: VALID_MEMBER_CUID, role: 'MEMBER' } });
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: VALID_MEMBER_CUID,
        passwordHash: oldHash,
        status: 'ACTIVE',
      });

      const result = await changePasswordAction({
        currentPassword: 'wrongPassword',
        newPassword: 'newStrongPassword2026!',
      });

      expect(result.success).toBe(false);
    if (result.success) throw Error('Expected failure');
      expect(result.error).toContain('Mật khẩu hiện tại không chính xác');
      expect(mocks.prisma.user.updateMany).not.toHaveBeenCalled();
    });
  });
});
