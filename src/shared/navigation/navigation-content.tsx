'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { RoutePageSkeleton } from '@/shared/ui/route-loading';
import { useNavigationTransition } from './navigation-transition';

export function NavigationContent({ children }: { children: ReactNode }) {
  const destination = useNavigationTransition()?.pathname;
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const initial = useRef(true);
  const previousPathname = useRef(pathname);
  useLayoutEffect(() => {
    const previous = previousPathname.current;
    previousPathname.current = pathname;
    if (initial.current) { initial.current = false; return; }
    if ((previous === '/admin' || previous?.startsWith('/admin/')) && (pathname === '/admin' || pathname?.startsWith('/admin/'))) return;
    const element = contentRef.current;
    if (destination || !element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: 0.5, translate: '0 8px' },
      { opacity: 1, translate: '0 0' },
    ], { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    return () => animation.cancel();
  }, [pathname, destination, children]);
  return <>
    {destination && <div data-destination-loading={destination} className="navigation-loading flex flex-1 flex-col"><RoutePageSkeleton pathname={destination} /></div>}
    <div ref={contentRef} hidden={!!destination} style={destination ? { display: 'none' } : undefined} className="flex flex-1 flex-col">{children}</div>
  </>;
}
