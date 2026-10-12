import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock('server-only', () => ({}));

import { getCurrentUser, requireCurrentUser } from '@/lib/current-user';

describe('current user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no actor when the request has no authenticated session', async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a session for a user who is no longer active', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'suspended-user' } });
    mocks.findUnique.mockResolvedValue({ id: 'suspended-user', role: 'ADMIN', status: 'SUSPENDED' });

    await expect(requireCurrentUser(['ADMIN'])).rejects.toThrow('Unauthorized');
  });

  it('returns the active database user only when their role is allowed', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'active-admin' } });
    mocks.findUnique.mockResolvedValue({ id: 'active-admin', role: 'ADMIN', status: 'ACTIVE' });

    await expect(requireCurrentUser(['ADMIN'])).resolves.toMatchObject({
      id: 'active-admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
  });
});
