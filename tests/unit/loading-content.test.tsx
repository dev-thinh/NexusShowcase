import { RoutePageSkeleton } from '@/shared/ui/route-loading';
import { MemberCardsSkeleton } from '@/shared/ui/content-skeletons';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('React', React);
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/members' }));

describe('data loading boundaries', () => {
  it('loads category and member data inside the page shell', () => {
    expect(fs.existsSync('src/app/loading.tsx')).toBe(false);
    expect(fs.readFileSync('src/app/(shell)/loading.tsx', 'utf8')).not.toContain('Navbar');
    expect(fs.existsSync('src/app/category/loading.tsx')).toBe(false);
    expect(fs.existsSync('src/app/members/loading.tsx')).toBe(false);
    const category = fs.readFileSync('src/features/publications/components/category-page.tsx', 'utf8');
    const members = fs.readFileSync('src/app/(shell)/(site)/members/page.tsx', 'utf8');
    expect(category).toContain("fallback={<PublicationSkeleton variant={slug === 'bai-bao-khoa-hoc' ? 'research' : 'projects'} />}");
    expect(members).toContain('<Suspense fallback=');
    expect(members).toContain('fallback={<MemberDirectorySkeleton />}');
    expect(members).toContain('<MemberResults />');
  });
  it('renders the destination title as text outside the busy data region', () => {
    const html = renderToStaticMarkup(<RoutePageSkeleton pathname="/research" />);
    const title = html.match(/<h1[^>]*>.*?<\/h1>/)?.[0] ?? '';
    expect(title).toContain('Nghiên cứu khoa học</h1>');
    expect(title).not.toContain('animate-pulse');
    expect(title).not.toContain('aria-busy');
    expect(renderToStaticMarkup(<MemberCardsSkeleton />)).toContain('aria-busy="true"');
  });

  it('keeps the current page visible while navigation is pending', () => {
    const css = fs.readFileSync('src/app/globals.css', 'utf8');
    const transition = fs.readFileSync('src/shared/navigation/navigation-transition.tsx', 'utf8');
    expect(css).not.toContain('[data-navigation-pending="true"] main');
    expect(transition).not.toContain('createPortal');
  });
});
