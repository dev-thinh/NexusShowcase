import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { NavigationContent } from '@/shared/navigation/navigation-content';
const state = vi.hoisted(() => ({ pathname: null as string | null }));
vi.stubGlobal('React', React);
vi.mock('@/shared/navigation/navigation-transition', () => ({ useNavigationTransition: () => state }));
vi.mock('next/navigation', () => ({ usePathname: () => '/contact' }));
beforeEach(() => { state.pathname = null; });
it('replaces the visible previous page with the destination skeleton before data arrives', () => {
  state.pathname = '/members';
  const html = renderToStaticMarkup(<NavigationContent><main>Previous page</main></NavigationContent>);
  expect(html).toContain('data-destination-loading="/members"');
  expect(html).toContain('Thành viên CLB Robotics &amp; IoT');
  expect(html).toContain('hidden=""');
  expect(html).toContain('Previous page');
});
it('reveals committed content without remounting the content wrapper', () => {
  const html = renderToStaticMarkup(<NavigationContent><main>Current page</main></NavigationContent>);
  expect(html).not.toContain('data-destination-loading');
  expect(html).not.toContain('hidden=""');
  expect(html).toContain('Current page');
});
