import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import AdminContentPage from '@/app/(shell)/(account)/admin/content/page';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), search: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/publications/server/bulk-actions', () => ({ searchBulkPostsAction: mocks.search }));
vi.mock('@/features/publications/components/admin-bulk-posts', () => ({ AdminBulkPosts: ({ mode }: { mode: string }) => <button>{mode}</button> }));
vi.mock('@/features/publications/components/card-admin-controls', () => ({ CardAdminControls: () => <button>Quản lý công trình</button> }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw Error(`redirect:${url}`); } }));
beforeEach(() => {
  vi.clearAllMocks(); mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  mocks.search.mockResolvedValue({ success: true, items: [{ id: 'post', title: 'Robot', slug: 'robot', type: 'PROJECT', isPinned: true, visibility: 'PUBLIC', publishedYear: 2026 }], total: 12, page: 1, totalPages: 2, counts: { ALL: 12, PINNED: 12, UNPINNED: 0, PUBLIC: 12, PRIVATE: 0 } });
});
it('keeps search and filters together in the content tab and pagination', async () => {
  const html = renderToStaticMarkup(await AdminContentPage({ searchParams: Promise.resolve({ q: ' robot ', filter: 'PINNED', page: '2' }) }));
  expect(mocks.search).toHaveBeenCalledWith({ query: 'robot', filter: 'PINNED', page: 2 });
  expect(html).toContain('Robot'); expect(html).toContain('12 công trình');
  expect(html).toContain('filter=PINNED&amp;q=robot&amp;page=2');
  expect(html).not.toContain('<main');
});
it('normalizes invalid filters and partial page numbers', async () => {
  await AdminContentPage({ searchParams: Promise.resolve({ filter: 'unknown', page: '2oops' }) });
  expect(mocks.search).toHaveBeenCalledWith({ query: '', filter: 'ALL', page: 1 });
});
it('requires admin authorization before reading content', async () => {
  mocks.actor.mockResolvedValue(null);
  await expect(AdminContentPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('redirect:/login');
  expect(mocks.search).not.toHaveBeenCalled();
});
