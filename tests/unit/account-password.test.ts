import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), findUnique: vi.fn(), update: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique, update: mocks.update } } }));
import { changePasswordAction } from '@/actions/account-actions';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'member-1' } });
  mocks.update.mockResolvedValue({});
});

describe('password changes', () => {
  it('stores a hash that accepts the new password and invalidates old sessions', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'member-1', status: 'ACTIVE', passwordHash: await bcrypt.hash('old-password', 4) });
    const result = await changePasswordAction({ currentPassword: 'old-password', newPassword: 'new-password' });
    expect(result.success).toBe(true);
    const { where, data } = mocks.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'member-1' });
    expect(await bcrypt.compare('new-password', data.passwordHash)).toBe(true);
    expect(await bcrypt.compare('old-password', data.passwordHash)).toBe(false);
    expect(data.mustChangePassword).toBe(false);
    expect(data.sessionVersion).toEqual({ increment: 1 });
  });

  it('leaves the password unchanged when the current password is wrong', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'member-1', status: 'ACTIVE', passwordHash: await bcrypt.hash('old-password', 4) });
    const result = await changePasswordAction({ currentPassword: 'wrong-password', newPassword: 'new-password' });
    expect(result.success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
