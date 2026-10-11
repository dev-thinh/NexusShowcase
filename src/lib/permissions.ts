import { Role } from '@prisma/client';

export interface UserSessionSubset {
  id?: string;
  role?: Role | string;
}

export function canUserUpload(user: UserSessionSubset | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === 'CORE_MEMBER' || user.role === 'ADMIN';
}

export function canUserReview(user: UserSessionSubset | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === 'ADMIN';
}

export function isMemberOrHigher(user: UserSessionSubset | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === 'ADMIN' || user.role === 'CORE_MEMBER' || user.role === 'MEMBER';
}
