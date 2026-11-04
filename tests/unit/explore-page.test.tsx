import { expect, it } from 'vitest';
import nextConfig from '../../next.config';
import { showcaseReturnTarget } from '@/features/publications/model/navigation';

it('retires the all-publications page in favor of research', async () => {
  expect(await nextConfig.redirects!()).toContainEqual({ source: '/explore', destination: '/research', permanent: true });
});
it('preserves search, year, sorting and pagination on old return links', () => {
  const query = new URLSearchParams({ q: 'robot & thị giác', year: '2026', sort: 'title', page: '2' });
  const destination = new URL(showcaseReturnTarget('/explore?' + query, '/projects'), 'https://test.local');
  expect(destination.pathname).toBe('/research');
  for (const [key, value] of query) expect(destination.searchParams.get(key)).toBe(value);
});
