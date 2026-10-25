'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { finishNavigation, navigationTarget, type NavigationDestination } from './state';

interface NavigationTransition {
  pathname: string | null;
  begin: (href: string, scroll?: boolean) => number | null;
  finish: (id: number) => void;
  navigate: (href: string, options: { replace?: boolean; scroll?: boolean }) => boolean;
}
const TransitionContext = createContext<NavigationTransition | null>(null);

/** Track the latest destination so its skeleton can replace the previous page immediately. */
export function NavigationTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [destination, setDestination] = useState<NavigationDestination | null>(null);
  const [scrollFloor, setScrollFloor] = useState<number | undefined>();
  const [isRouting, startRouting] = useTransition();
  const routingRequest = useRef<number | null>(null);
  const observedRouting = useRef<number | null>(null);
  const contentRoot = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const cancelScroll = useRef<(() => void) | null>(null);
  const pendingScroll = useRef<{ pathname: string; top: number } | null>(null);
  const begin = useCallback((href: string, scroll = true) => {
    cancelScroll.current?.();
    ++sequence.current;
    const target = navigationTarget(href, window.location.href);
    if ((window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) && (target === '/admin' || target?.startsWith('/admin/'))) return null;
    // Filtering the current page keeps its heading, form and section tabs visible.
    // Let Next handle query-only updates without replacing the entire page shell.
    if (!target || target === window.location.pathname) return null;
    const id = sequence.current;
    pendingScroll.current = scroll && !href.includes('#') ? { pathname: target, top: window.scrollY } : null;
    // The loading skeleton must not shorten the document and clamp its scroll.
    setScrollFloor(pendingScroll.current ? window.scrollY + window.innerHeight : undefined);
    setDestination({ id, pathname: target });
    return id;
  }, []);
  const navigate = useCallback((href: string, options: { replace?: boolean; scroll?: boolean }) => {
    const target = navigationTarget(href, window.location.href);
    if ((window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) && (target === '/admin' || target?.startsWith('/admin/'))) return false;
    if (!target || target === window.location.pathname || href.includes('#') || options.scroll === false) return false;
    routingRequest.current = begin(href);
    startRouting(() => {
      if (options.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
    return true;
  }, [begin, router, startRouting]);
  const finish = useCallback((id: number) => setDestination(current => finishNavigation(current, id)), []);
  // Native loading.tsx or the completed destination takes over after a route commit.
  useLayoutEffect(() => {
    const requestId = destination?.id;
    if (isRouting && requestId === routingRequest.current) observedRouting.current = requestId;
    // A redirect may commit another pathname, or even return to the original
    // route. Transition completion releases only the request that it observed.
    const completed = !isRouting && requestId !== undefined && requestId === sequence.current
      && requestId === routingRequest.current && requestId === observedRouting.current;
    const pending = pendingScroll.current;
    if (pending && (pending.pathname === pathname || completed)) {
      pendingScroll.current = null;
      const id = sequence.current;
      let frame = requestAnimationFrame(() => {
        if (id !== sequence.current) return;
        // Measure after the destination has replaced the loading skeleton.
        const height = contentRoot.current?.firstElementChild?.getBoundingClientRect().height;
        const top = height === undefined ? pending.top : Math.min(pending.top, Math.max(0, height - window.innerHeight));
        setScrollFloor(undefined);
        window.scrollTo({ top, left: 0, behavior: 'instant' });
        frame = requestAnimationFrame(() => {
          if (id !== sequence.current) return;
          window.scrollTo({ top: 0, left: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
          cancelScroll.current = null;
        });
      });
      cancelScroll.current = () => { cancelAnimationFrame(frame); cancelScroll.current = null; };
    }
    if (completed) {
      routingRequest.current = null;
      observedRouting.current = null;
      if (!pending) setScrollFloor(undefined);
    }
    setDestination(current => current?.pathname === pathname || (completed && current?.id === requestId) ? null : current);
  }, [pathname, isRouting, destination?.id]);
  useLayoutEffect(() => () => { cancelScroll.current?.(); }, []);
  const context = useMemo(() => ({ pathname: destination?.pathname ?? null, begin, finish, navigate }), [destination?.pathname, begin, finish, navigate]);

  return <TransitionContext.Provider value={context}>
    {destination && <div role="status" className="navigation-progress pointer-events-none fixed inset-x-0 top-0 z-50"><span className="sr-only">Đang chuyển trang…</span></div>}
    <div ref={contentRoot} data-navigation-pending={destination ? 'true' : undefined} style={scrollFloor === undefined ? undefined : { minHeight: scrollFloor }}>
      {children}
    </div>
  </TransitionContext.Provider>;
}

export function useNavigationTransition() { return useContext(TransitionContext); }
export function useNavigationPathname() {
  const pathname = usePathname();
  return pathname;
}
export function useNavigationVisualPathname() {
  const pathname = usePathname();
  return useNavigationTransition()?.pathname ?? pathname;
}
