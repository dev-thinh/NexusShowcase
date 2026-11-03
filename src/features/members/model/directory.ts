import { MEMBER_ROLE_LABELS } from '@/features/identity/model/member-role';
import type { PublicUser } from '@/features/identity/model/public-user';
import type { Role } from '@prisma/client';

export type PublicMemberRole = Extract<
  Role,
  'ADMIN' | 'CORE_MEMBER' | 'MEMBER'
>;

export type MemberDirectoryEntry = PublicUser & {
  role: PublicMemberRole;
  _count: { contributions: number };
};

export const MEMBER_GROUP_LABELS: Record<PublicMemberRole, string> = MEMBER_ROLE_LABELS;

export function sortMembersByContribution<T extends Pick<MemberDirectoryEntry, 'id' | 'fullName' | '_count'>>(
  members: T[],
): T[] {
  return [...members].sort(
    (left, right) =>
      right._count.contributions - left._count.contributions ||
      left.fullName.localeCompare(right.fullName, 'vi') || left.id.localeCompare(right.id),
  );
}
