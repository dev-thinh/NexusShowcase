'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface Destination {
  id: number;
  pathname: string;
}
interface NavigationTransition {
  pathname: string | null;
  begin: (href: string) => number | null;
  finish: (id: number) => void;
}
const TransitionContext = createContext<NavigationTransition | null>(null);

/** Track pending links while keeping the current page visible until Next commits. */
export function NavigationTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [destination, setDestination] = useState<Destination | null>(null);
  const sequence = useRef(0);
  const begin = useCallback((href: string) => {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname && url.search === window.location.search) return null;
    const id = ++sequence.current;
    setDestination({ id, pathname: url.pathname });
    return id;
  }, []);
  const finish = useCallback((id: number) => setDestination(current => current?.id === id ? null : current), []);
  // Native loading.tsx or the completed destination takes over after a route commit.
  useLayoutEffect(() => {
    setDestination(current => current?.pathname === pathname ? null : current);
  }, [pathname]);
  const context = useMemo(() => ({ pathname: destination?.pathname ?? null, begin, finish }), [destination?.pathname, begin, finish]);

  return <TransitionContext.Provider value={context}>
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
