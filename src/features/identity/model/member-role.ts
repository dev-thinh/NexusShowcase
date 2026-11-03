/** Public membership names; persistence and authorization keep their existing role codes. */
export const MEMBER_ROLE_LABELS = {
  ADMIN: 'Ban chủ nhiệm',
  CORE_MEMBER: 'Trưởng nhóm',
  MEMBER: 'Thành viên',
} as const;

export function getMemberRoleLabel(role: string | undefined): string {
  if (role === 'ADMIN') return MEMBER_ROLE_LABELS.ADMIN;
  if (role === 'CORE_MEMBER') return MEMBER_ROLE_LABELS.CORE_MEMBER;
  return MEMBER_ROLE_LABELS.MEMBER;
}
