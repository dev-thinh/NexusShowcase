import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(), count: vi.fn().mockResolvedValue(1),
}));

vi.mock('@/features/identity/server/auth', () => ({ auth: mocks.auth }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { findMany: mocks.findMany, count: mocks.count } } }));
vi.mock('server-only', () => ({}));

import AdminMembersPage from '@/app/(shell)/(account)/admin/members/page';
import { adminMemberClientSelect, publicUserSelect } from '@/features/identity/model/public-user';

describe('public user data boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not select credentials or direct identifiers for public queries', () => {
    expect(publicUserSelect).not.toHaveProperty('passwordHash');
    expect(publicUserSelect).not.toHaveProperty('email');
    expect(publicUserSelect).not.toHaveProperty('studentId');
  });

  it('selects only safe fields for admin member client rows', () => {
    expect(adminMemberClientSelect).toEqual({
      id: true,
      fullName: true,
      role: true,
      createdAt: true,
    });
  });

  it('uses the safe admin member selector in the real page query', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' } });
    mocks.findMany.mockRejectedValue(new Error('stop after capturing query'));

    await expect(AdminMembersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('stop after capturing query');

    const [query] = mocks.findMany.mock.calls[0];
    expect(query.select).toBe(adminMemberClientSelect);
  });
});
