import { invalidatePaths } from '@/server/cache/invalidation';

export function invalidateIdentityChange(memberIds: readonly string[]): void {
  invalidatePaths(['/members/[id]'], 'page');
  invalidatePaths(['/', '/admin/members', '/members', '/members/all', '/my-works', ...memberIds.map(id => `/members/${id}`)]);
}
