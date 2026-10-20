import type { Role } from '@prisma/client';
import type { PublicUser } from '@/lib/public-user';

export type PublicMemberRole = Extract<
  Role,
  'ADMIN' | 'CORE_MEMBER' | 'MEMBER'
>;

export type MemberDirectoryEntry = PublicUser & {
  studentId: string | null;
  role: PublicMemberRole;
  _count: { contributions: number };
};

export const MEMBER_GROUP_LABELS: Record<PublicMemberRole, string> = {
  ADMIN: 'Ban Chủ Nhiệm',
  CORE_MEMBER: 'Nghiên cứu viên & Thành viên Kỳ cựu',
  MEMBER: 'Thành viên',
};

export function sortMembersByContribution<T extends MemberDirectoryEntry>(
  members: T[],
): T[] {
  return [...members].sort(
    (left, right) =>
      right._count.contributions - left._count.contributions ||
      left.fullName.localeCompare(right.fullName, 'vi'),
  );
}

export function normalizeMemberPage(
  rawPage: string | undefined,
  totalPages: number,
): number {
  const parsed = Number.parseInt(rawPage ?? '1', 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, Math.max(totalPages, 1));
}

export function paginateMembers<T>(
  items: T[],
  rawPage: string | undefined,
  pageSize: number,
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = normalizeMemberPage(rawPage, totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    totalPages,
    totalItems,
  };
}
