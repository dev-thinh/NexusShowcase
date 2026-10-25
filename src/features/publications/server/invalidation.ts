import { invalidatePaths } from '@/server/cache/invalidation';

export function invalidatePublicationChange(input: { slugs: readonly string[]; memberIds: readonly string[]; kind: 'PUBLICATION' | 'VISIBILITY' | 'PIN' | 'SUBMISSION' | 'IDENTITY' }): void {
  const paths = input.kind === 'SUBMISSION'
    ? ['/dashboard', '/admin/reviews']
    : ['/', '/admin', '/admin/content', '/dashboard', '/members', '/members/all', '/admin/reviews', '/category/bai-bao-khoa-hoc', '/category/robotics-iot'];
  invalidatePaths([...paths, ...input.slugs.map(slug => `/showcase/${slug}`), ...input.memberIds.map(id => `/members/${id}`)]);
}
