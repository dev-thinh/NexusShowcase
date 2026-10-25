import { changePasswordAction } from '@/features/identity/server/account-actions';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(),
}));
vi.mock('@/features/identity/server/auth', () => ({ auth: mocks.auth }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique, updateMany: mocks.updateMany } } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'member-1' } });
  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe('password changes', () => {
  it('stores a hash that accepts the new password and invalidates old sessions', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'member-1', status: 'ACTIVE', mustChangePassword: true, passwordHash: await bcrypt.hash('old-password', 4) });
    const result = await changePasswordAction({ currentPassword: 'old-password', newPassword: 'new-password' });
    expect(result.success).toBe(true);
    const { where, data } = mocks.updateMany.mock.calls[0][0];
    expect(where).toMatchObject({ id: 'member-1', passwordHash: expect.any(String), status: 'ACTIVE', deletedAt: null });
    expect(await bcrypt.compare('new-password', data.passwordHash)).toBe(true);
    expect(await bcrypt.compare('old-password', data.passwordHash)).toBe(false);
    expect(data.mustChangePassword).toBe(false);
    expect(data.sessionVersion).toEqual({ increment: 1 });
  });

  it('leaves the password unchanged when the current password is wrong', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'member-1', status: 'ACTIVE', passwordHash: await bcrypt.hash('old-password', 4) });
    const result = await changePasswordAction({ currentPassword: 'wrong-password', newPassword: 'new-password' });
    expect(result.success).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});

it('rejects a stale password update when another request already changed it', async () => {
 mocks.findUnique.mockResolvedValue({ id: 'member-1', status: 'ACTIVE', sessionVersion: 1, passwordHash: await bcrypt.hash('old-password', 4) });
 mocks.updateMany.mockResolvedValue({ count: 0 });
 expect(await changePasswordAction({ currentPassword: 'old-password', newPassword: 'new-password' })).toMatchObject({ success: false, code: 'CONFLICT' });
});
