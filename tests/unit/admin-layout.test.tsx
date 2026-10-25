import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import AdminLayout from '@/app/(shell)/(account)/admin/layout';
const actor = vi.hoisted(() => vi.fn());
vi.mock('@/features/identity/server/actor', () => ({ getActor: actor }));
vi.mock('@/app/(shell)/_components/admin-tabs', () => ({ AdminTabs: () => <nav aria-label="Điều hướng quản trị" /> }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw Error(`redirect:${url}`); } }));
beforeEach(() => actor.mockResolvedValue({ id: 'admin', role: 'ADMIN', mustChangePassword: false }));
it('renders one persistent heading and navigation above the changing content', async () => {
  const html = renderToStaticMarkup(await AdminLayout({ children: <section>Nội dung tab</section> }));
  expect(html.match(/<main/g)).toHaveLength(1);
  expect(html.match(/<h1/g)).toHaveLength(1);
  expect(html).toContain('data-admin-workspace');
  expect(html.indexOf('Điều hướng quản trị')).toBeLessThan(html.indexOf('id="admin-tab-content"'));
  expect(html).toContain('Nội dung tab');
});
it.each([null, { role: 'MEMBER' }, { role: 'ADMIN', mustChangePassword: true }])('enforces workspace access for %j', async value => {
  actor.mockResolvedValue(value);
  await expect(AdminLayout({ children: null })).rejects.toThrow(value === null ? 'redirect:/login' : value.role === 'MEMBER' ? 'redirect:/' : 'redirect:/account/change-password');
});
