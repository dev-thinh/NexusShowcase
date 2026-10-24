import type { PublicMemberRole } from './directory';

export type HomeMember = { id: string; fullName: string; avatarUrl: string | null; role: PublicMemberRole };
export type HomeMembersPayload = { members: HomeMember[]; total: number };

export function homeMemberSlots(counts: Record<PublicMemberRole, number>): Record<PublicMemberRole, number> {
  const total = counts.ADMIN + counts.CORE_MEMBER + counts.MEMBER;
  if (total <= 30) return { ...counts };
  // One position belongs to the link to the complete directory. If the admin
  // group itself outgrows the wall, retain the hard cap and include it in +N.
  const admins = Math.min(counts.ADMIN, 29);
  const core = Math.min(counts.CORE_MEMBER, 10, 29 - admins);
  return { ADMIN: admins, CORE_MEMBER: core, MEMBER: Math.min(counts.MEMBER, 29 - admins - core) };
}
