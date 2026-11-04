import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import ExplorePage from '@/app/(shell)/(site)/explore/page';

it('retires the all-publications page in favor of research', async () => {
  await expect(ExplorePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('redirect:/category/bai-bao-khoa-hoc');
});
it('preserves search, year, sorting and pagination on old links', async () => {
  const query = { q: 'robot & thị giác', year: '2026', sort: 'title', page: '2' };
  await expect(ExplorePage({ searchParams: Promise.resolve(query) })).rejects.toThrow('redirect:');
  const destination = new URL(mocks.redirect.mock.calls.at(-1)![0], 'https://test.local');
  expect(destination.pathname).toBe('/category/bai-bao-khoa-hoc');
  for (const [key, value] of Object.entries(query)) expect(destination.searchParams.get(key)).toBe(value);
});
