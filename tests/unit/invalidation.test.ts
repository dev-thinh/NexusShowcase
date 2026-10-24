import { invalidatePublicationChange } from '@/features/publications/server/invalidation';
import { beforeEach, expect, it, vi } from 'vitest';
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock('next/cache', () => cache);
beforeEach(() => vi.clearAllMocks());
it('invalidates affected publication and member pages without duplicates', () => {
  invalidatePublicationChange({ kind: 'PUBLICATION', slugs: ['paper', 'paper'], memberIds: ['member-1'] });
  const paths = cache.revalidatePath.mock.calls.map(([value]) => value);
  expect(paths).toEqual(expect.arrayContaining(['/showcase/paper', '/members/member-1', '/', '/members', '/admin/reviews']));
  expect(paths.filter(path => path === '/showcase/paper')).toHaveLength(1);
});
it('reports cache errors without converting a committed command into failure', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  cache.revalidatePath.mockImplementationOnce(() => { throw Error('secret cache payload'); });
  expect(() => invalidatePublicationChange({ kind: 'PIN', slugs: ['paper'], memberIds: [] })).not.toThrow();
  expect(log).toHaveBeenCalled();
  expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
  log.mockRestore();
});
