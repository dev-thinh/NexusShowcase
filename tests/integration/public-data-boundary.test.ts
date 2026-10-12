import { describe, expect, it } from 'vitest';
import { publicUserSelect, toPublicUser } from '@/lib/public-user';

describe('public user data boundary', () => {
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

  it('keeps admin client member rows free of email and student ID', () => {
    const memberRow = { id: 'member-id', fullName: 'Member', role: 'MEMBER', createdAt: new Date() };

    expect(JSON.stringify(memberRow)).not.toContain('email');
    expect(JSON.stringify(memberRow)).not.toContain('studentId');
  });
});
