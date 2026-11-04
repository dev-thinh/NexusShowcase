import { invalidatePaths } from '@/server/cache/invalidation';

export function invalidatePublicationChange(input: { slugs: readonly string[]; memberIds: readonly string[]; kind: 'PUBLICATION' | 'VISIBILITY' | 'PIN' | 'SUBMISSION' | 'IDENTITY' }): void {
  const paths = input.kind === 'SUBMISSION'
    ? ['/my-works', '/admin/reviews']
    : ['/', '/admin', '/admin/works', '/my-works', '/members', '/members/all', '/admin/reviews', '/research', '/projects'];
  invalidatePaths(['/members/[id]'], 'page');
  invalidatePaths([...paths, ...input.slugs.map(slug => `/works/${slug}`), ...input.memberIds.map(id => `/members/${id}`)]);
}
