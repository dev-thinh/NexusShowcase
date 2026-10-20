import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findMany: mocks.findMany } } }));
vi.mock('server-only', () => ({}));

import AdminMembersPage from '@/app/admin/members/page';
import { adminMemberClientSelect, publicUserSelect, toPublicUser } from '@/lib/public-user';

describe('public user data boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes a user without password, email, or student ID', () => {
    const publicUser = toPublicUser({
      id: 'member-id',
      fullName: 'Public Member',
      email: 'private@nexus.test',
      studentId: '2012345',
      passwordHash: 'never-serialize-this',
      avatarUrl: null,
      bio: null,
      githubUrl: null,
      linkedinUrl: null,
      googleScholarUrl: null,
      portfolioUrl: null,
      role: 'MEMBER',
      status: 'ACTIVE',
    });

    expect(publicUser).toEqual({
      id: 'member-id',
      fullName: 'Public Member',
      avatarUrl: null,
      bio: null,
      githubUrl: null,
      linkedinUrl: null,
      googleScholarUrl: null,
      portfolioUrl: null,
      role: 'MEMBER',
    });
    expect(JSON.stringify(publicUser)).not.toContain('passwordHash');
    expect(JSON.stringify(publicUser)).not.toContain('private@nexus.test');
    expect(JSON.stringify(publicUser)).not.toContain('2012345');
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

    await expect(AdminMembersPage()).rejects.toThrow('stop after capturing query');

    const [query] = mocks.findMany.mock.calls[0];
    expect(query.select).toBe(adminMemberClientSelect);
  });
});
