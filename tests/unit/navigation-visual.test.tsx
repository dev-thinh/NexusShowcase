import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ committed: '/contact', visual: '/members' }));
vi.mock('@/shared/navigation/navigation-transition', () => ({
  useNavigationPathname: () => state.committed,
  useNavigationVisualPathname: () => state.visual,
}));
vi.mock('@/shared/navigation/navigation-link', () => ({ NavigationLink: ({ children, prefetch: _prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => <a {...props}>{children}</a> }));
import { PublicNavigation } from '@/app/(shell)/_components/navbar-nav';

it('paints the destination background immediately while aria-current stays committed', () => {
  const html = renderToStaticMarkup(<PublicNavigation />);
  const members = html.match(/<a[^>]*href="\/members"[^>]*>/)![0];
  const contact = html.match(/<a[^>]*href="\/contact"[^>]*>/)![0];
  expect(members).toContain('bg-brand-button');
  expect(members).not.toContain('aria-current');
  expect(contact).toContain('aria-current="page"');
  expect(contact).not.toContain('bg-brand-button');
  expect(members).not.toContain('transition-all');
});
