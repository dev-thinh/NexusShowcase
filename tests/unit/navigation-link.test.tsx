import { NavigationLink } from '@/shared/navigation/navigation-link';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ prefetch: undefined as boolean | null | undefined, pending: false, begin: vi.fn(() => 1), finish: vi.fn(), navigate: null as null | ((event: { preventDefault: () => void }) => void) }));
vi.stubGlobal('React', React);
vi.mock('@/shared/navigation/navigation-transition', () => ({ useNavigationTransition: () => ({ pathname: null, begin: state.begin, finish: state.finish }) }));
vi.mock('next/link', () => ({
  default: ({ children, onNavigate, prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { onNavigate: typeof state.navigate; prefetch?: boolean | null }) => { state.navigate = onNavigate; state.prefetch = prefetch; return <a {...props}>{children}</a>; },
  useLinkStatus: () => state,
}));
beforeEach(() => { vi.clearAllMocks(); state.pending = false; state.navigate = null; });

describe('tab navigation feedback', () => {
  it('does not fetch unopened routes merely because their links are visible', () => {
    renderToStaticMarkup(<NavigationLink href="/members">Thành viên</NavigationLink>);
    expect(state.prefetch).toBe(false);
  });
  it('keeps the route, current state and visible label on a native link', () => {
    const markup = renderToStaticMarkup(<NavigationLink href="/members" aria-current="page" className="h-9">Thành viên</NavigationLink>);
    expect(markup).toContain('href="/members"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('Thành viên');
    expect(markup).not.toContain('role="status"');
  });
  it('announces pending navigation without changing its label or dimensions', () => {
    state.pending = true;
    const markup = renderToStaticMarkup(<NavigationLink href="/contact" className="h-9">Liên hệ</NavigationLink>);
    expect(markup).toContain('role="status"');
    expect(markup).toContain('Đang chuyển trang…');
    expect(markup).not.toContain('ring-2');
    expect(markup).not.toContain('absolute inset-0');
    state.pending = false;
    expect(renderToStaticMarkup(<NavigationLink href="/contact">Liên hệ</NavigationLink>)).not.toContain('role="status"');
  });
  it('starts the destination skeleton synchronously before a server response is pending', () => {
    renderToStaticMarkup(<NavigationLink href="/members">Thành viên</NavigationLink>);
    const preventDefault = vi.fn();
    state.navigate?.({ preventDefault });
    expect(state.begin).toHaveBeenCalledWith('/members');
    expect(preventDefault).not.toHaveBeenCalled();
  });
  it('respects a caller that cancels navigation', () => {
    renderToStaticMarkup(<NavigationLink href="/members" onNavigate={event => event.preventDefault()}>Thành viên</NavigationLink>);
    const preventDefault = vi.fn();
    state.navigate?.({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(state.begin).not.toHaveBeenCalled();
  });

  it('tracks query-only destinations supplied as URL objects', () => {
    renderToStaticMarkup(<NavigationLink href={{ pathname: '/', query: { q: 'robot', page: 2 } }}>Search</NavigationLink>);
    state.navigate?.({ preventDefault: vi.fn() });
    expect(state.begin).toHaveBeenCalledWith('/?q=robot&page=2');
  });

});
