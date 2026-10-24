import { invalidatePaths } from '@/server/cache/invalidation';

export function invalidateIdentityChange(memberIds: readonly string[]): void {
  invalidatePaths(['/', '/admin/members', '/members', '/members/all', '/dashboard', ...memberIds.map(id => `/members/${id}`)]);
}
