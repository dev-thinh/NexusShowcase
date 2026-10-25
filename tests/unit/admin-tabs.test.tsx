import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { AdminTabs } from '@/app/(shell)/_components/admin-tabs';
const route = vi.hoisted(() => ({ pathname: '/admin', search: new URLSearchParams() }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname, useSearchParams: () => route.search }));
beforeEach(() => { route.pathname = '/admin'; route.search = new URLSearchParams(); });
it('shows only the four management tabs and gives the active tab bold emphasis', () => {
  const html = renderToStaticMarkup(<AdminTabs />);
  expect(html).toContain('Tổng quan'); expect(html).toContain('Phê duyệt'); expect(html).toContain('Thành viên'); expect(html).toContain('Nội dung');
  expect(html).not.toContain('Bài đăng của tôi'); expect(html).not.toContain('Hồ sơ của tôi');
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html).toMatch(/aria-current="page"[^>]*font-semibold/);
  expect(html).toContain('text-slate-500');
});
it('keeps the reviews tab selected while viewing a submitted article', () => {
  route.pathname = '/admin/reviews/submission';
  const html = renderToStaticMarkup(<AdminTabs />);
  expect(html).toMatch(/aria-current="page"[^>]*href="\/admin\/reviews"/);
});
it('selects content independently of the other tabs', () => {
  route.pathname = '/admin/content';
  const html = renderToStaticMarkup(<AdminTabs />);
  expect(html).toMatch(/aria-current="page"[^>]*href="\/admin\/content"/);
});
