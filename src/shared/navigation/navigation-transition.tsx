'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { finishNavigation, navigationTarget, type NavigationDestination } from './state';

interface NavigationTransition {
  pathname: string | null;
  begin: (href: string) => number | null;
  finish: (id: number) => void;
}
const TransitionContext = createContext<NavigationTransition | null>(null);

/** Track the latest destination so its skeleton can replace the previous page immediately. */
export function NavigationTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [destination, setDestination] = useState<NavigationDestination | null>(null);
  const sequence = useRef(0);
  const begin = useCallback((href: string) => {
    const target = navigationTarget(href, window.location.href);
    // Filtering the current page keeps its heading, form and section tabs visible.
    // Let Next handle query-only updates without replacing the entire page shell.
    if (!target || target === window.location.pathname) return null;
    const id = ++sequence.current;
    setDestination({ id, pathname: target });
    return id;
  }, []);
  const finish = useCallback((id: number) => setDestination(current => finishNavigation(current, id)), []);
  // Native loading.tsx or the completed destination takes over after a route commit.
  useLayoutEffect(() => {
    setDestination(current => current?.pathname === pathname ? null : current);
  }, [pathname]);
  const context = useMemo(() => ({ pathname: destination?.pathname ?? null, begin, finish }), [destination?.pathname, begin, finish]);

  return <TransitionContext.Provider value={context}>
    {destination && <div role="status" className="navigation-progress pointer-events-none fixed inset-x-0 top-0 z-50"><span className="sr-only">Đang chuyển trang…</span></div>}
    <div data-navigation-pending={destination ? 'true' : undefined}>
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
