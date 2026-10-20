import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { LoadingCards, LoadingTitle } from '@/components/loading-content';

vi.stubGlobal('React', React);
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/members' }));

describe('data loading boundaries', () => {
  it('loads category and member data inside the page shell', () => {
    expect(fs.existsSync('src/app/loading.tsx')).toBe(false);
    expect(fs.existsSync('src/app/category/loading.tsx')).toBe(false);
    expect(fs.existsSync('src/app/members/loading.tsx')).toBe(false);
    const category = fs.readFileSync('src/app/category/[slug]/page.tsx', 'utf8');
    const members = fs.readFileSync('src/app/members/page.tsx', 'utf8');
    expect(category).toContain('fallback={<LoadingCards />}><CategoryResults />');
    expect(members).toContain('fallback={<LoadingCards members />}><MemberResults />');
  });
  it('renders the destination title as text outside the busy data region', () => {
    const title = renderToStaticMarkup(<LoadingTitle fallback="Danh sách" />);
    expect(title).toContain('Quản lý thành viên</h1>');
    expect(title).not.toContain('animate-pulse');
    expect(title).not.toContain('aria-busy');
    expect(renderToStaticMarkup(<LoadingCards members />)).toContain('aria-busy="true"');
  });

  it('keeps the current page visible while navigation is pending', () => {
    const css = fs.readFileSync('src/app/globals.css', 'utf8');
    const transition = fs.readFileSync('src/components/navigation-transition.tsx', 'utf8');
    expect(css).not.toContain('[data-navigation-pending="true"] main');
    expect(transition).not.toContain('createPortal');
  });
});
