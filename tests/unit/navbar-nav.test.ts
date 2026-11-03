import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/shared/navigation/navigation-transition', () => ({ useNavigationPathname: () => '/', useNavigationVisualPathname: () => '/' }));
vi.mock('@/shared/navigation/navigation-link', () => ({ NavigationLink: ({ children, prefetch: _prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => React.createElement('a', props, children) }));
import { PublicNavigation } from '@/app/(shell)/_components/navbar-nav';

describe('Navbar Nav Component Structure', () => {
  it('implements the exact requested order and naming', () => {
    const navbarNavPath = path.resolve(process.cwd(), 'src/app/(shell)/_components/navbar-nav.tsx');
    const content = fs.readFileSync(navbarNavPath, 'utf-8');

    // Personal actions belong to the authenticated profile disclosure.
    expect(content).toContain('Công trình của tôi');
    expect(content).not.toContain('<span>Dashboard</span>');
    expect(content).toContain('aria-controls="profile-navigation"');
    expect(content).toContain("href: '/dashboard'");
    expect(content).toContain('bg-brand-button');

    const html = renderToStaticMarkup(React.createElement(PublicNavigation));
    const links = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map(match => ({ href: match[1], label: match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&') }));
    expect(links).toEqual([
      { href: '/', label: 'Trang chủ' },
      { href: '/category/bai-bao-khoa-hoc', label: 'Nghiên cứu khoa học' },
      { href: '/category/robotics-iot', label: 'Dự án & Sản phẩm' },
      { href: '/members', label: 'Thành viên' },
      { href: '/contact', label: 'Liên hệ' },
    ]);
    expect(html).toContain('aria-controls="public-navigation"');
    expect(html).toContain('aria-expanded="false"');

    // Layout assigns tabs and account actions to explicit columns in the
    // navbar's balanced three-column grid.
    expect(content).toContain('col-start-2 row-start-1 justify-self-center');
    expect(content).toContain('col-start-3 row-start-1 justify-self-end');
    expect(content).not.toContain('absolute left-1/2 -translate-x-1/2');
    expect(content).toContain('right-0');
    expect(content).not.toContain('fixed bottom-5 right-5');
    expect(content).not.toContain('aria-label="Lối tắt Quản trị"');
  });

  it('renders core tabs without querying unused category counts', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/app/(shell)/_components/navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    expect(content).not.toContain('getFeaturedNavCategories');
    expect(content).not.toContain('featuredCategories');
    expect(content).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');

    const html = renderToStaticMarkup(React.createElement(PublicNavigation));
    expect(html).toContain('href="/category/bai-bao-khoa-hoc"');
    expect(html).toContain('href="/category/robotics-iot"');
  });

  it('keeps one admin workspace entry and personal actions in the account menu', () => {
    const navbarNavPath = path.resolve(process.cwd(), 'src/app/(shell)/_components/navbar-nav.tsx');
    const navContent = fs.readFileSync(navbarNavPath, 'utf-8');

    expect(navContent).toContain("href: '/admin', label: 'Quản trị'");
    expect(navContent).not.toContain("href: '/admin/reviews'");
    expect(navContent).not.toContain("href: '/admin/members'");
    expect(navContent).toContain("href: '/dashboard'");
  });
});
