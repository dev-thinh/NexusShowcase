import {
MEMBER_GROUP_LABELS,
sortMembersByContribution,
type MemberDirectoryEntry,
} from '@/features/members/model/directory';
import { describe, expect, it } from 'vitest';

const member = (
  id: string,
  fullName: string,
  contributions: number,
): MemberDirectoryEntry => ({
  id,
  fullName,
  avatarUrl: null,
  bio: null,
  githubUrl: null,
  linkedinUrl: null,
  googleScholarUrl: null,
  portfolioUrl: null,
  role: 'MEMBER',
  _count: { contributions },
});

describe('member directory', () => {
  it('maps the three public groups to the approved labels', () => {
    expect(MEMBER_GROUP_LABELS).toEqual({
      ADMIN: 'Ban Chủ Nhiệm',
      CORE_MEMBER: 'Nghiên cứu viên & Thành viên Kỳ cựu',
      MEMBER: 'Thành viên',
    });
  });

  it('orders published contributions descending and breaks ties by name', () => {
    const result = sortMembersByContribution([
      member('1', 'Minh', 2),
      member('2', 'An', 4),
      member('3', 'Bình', 4),
    ]);

    expect(result.map(({ id }) => id)).toEqual(['2', '3', '1']);
  });

});
