import { describe, expect, it } from 'vitest';
import {
  MEMBER_GROUP_LABELS,
  normalizeMemberPage,
  paginateMembers,
  sortMembersByContribution,
  type MemberDirectoryEntry,
} from '@/lib/member-directory';

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
  studentId: null,
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

  it.each([
    { raw: undefined, total: 3, expected: 1 },
    { raw: 'abc', total: 3, expected: 1 },
    { raw: '-2', total: 3, expected: 1 },
    { raw: '9', total: 3, expected: 3 },
  ])('normalizes page $raw to $expected', ({ raw, total, expected }) => {
    expect(normalizeMemberPage(raw, total)).toBe(expected);
  });

  it('returns one page slice and page metadata', () => {
    const result = paginateMembers(
      Array.from({ length: 8 }, (_, index) =>
        member(String(index), `User ${index}`, 8 - index),
      ),
      '2',
      6,
    );

    expect(result.items.map(({ id }) => id)).toEqual(['6', '7']);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.totalItems).toBe(8);
  });
});
