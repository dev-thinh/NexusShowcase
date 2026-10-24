import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('@/features/identity/server/auth', () => ({ auth: mocks.auth }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock('server-only', () => ({}));

import { getActor } from '@/features/identity/server/actor';

describe('current user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no actor when the request has no authenticated session', async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(getActor()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a session for a user who is no longer active', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'suspended-user' } });
    mocks.findUnique.mockResolvedValue({ id: 'suspended-user', role: 'ADMIN', status: 'SUSPENDED' });

    await expect(getActor(['ADMIN'])).resolves.toBeNull();
  });

  it('returns the active database user only when their role is allowed', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'active-admin' } });
    mocks.findUnique.mockResolvedValue({ id: 'active-admin', role: 'ADMIN', status: 'ACTIVE' });

    await expect(getActor(['ADMIN'])).resolves.toMatchObject({
      id: 'active-admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
  });

  it.each([{ status: 'ACTIVE', deletedAt: new Date() }, { status: 'ACTIVE', mustChangePassword: true }])('rejects an ineligible database actor %j', async flags => {
    mocks.auth.mockResolvedValue({ user: { id: 'user' } });
    mocks.findUnique.mockResolvedValue({ id: 'user', role: 'ADMIN', ...flags });
    await expect(getActor()).resolves.toBeNull();
  });
});
