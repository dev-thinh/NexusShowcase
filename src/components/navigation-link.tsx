'use client';

import Link, { useLinkStatus } from 'next/link';
import { useEffect, useRef, type ComponentProps } from 'react';
import { useNavigationTransition } from '@/components/navigation-transition';

function PendingNavigation({ requestId }: { requestId: { current: number | null } }) {
  const { pending } = useLinkStatus();
  const navigation = useNavigationTransition();
  const wasPending = useRef(false);
  useEffect(() => {
    if (pending) wasPending.current = true;
    else if (wasPending.current && requestId.current !== null) {
      navigation?.finish(requestId.current);
      requestId.current = null;
      wasPending.current = false;
    }
  }, [pending, navigation, requestId]);
  if (!pending) return null;
  return <>
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-slate-400/10 ring-2 ring-inset ring-slate-400/40" />
    <span role="status" className="sr-only">Đang chuyển trang…</span>
  </>;
}

/** Preserve native navigation, prefetch, history and modified-click behavior. */
export function NavigationLink({ children, className = '', onNavigate, href, ...props }: ComponentProps<typeof Link>) {
  const navigation = useNavigationTransition();
  const requestId = useRef<number | null>(null);
  return <Link {...props} href={href} className={`relative ${className}`} onNavigate={event => {
    let cancelled = false;
    onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
    if (!cancelled) {
      const target = typeof href === 'string' ? href : `${href.pathname ?? ''}${href.search ?? ''}${href.hash ?? ''}`;
      requestId.current = navigation?.begin(target) ?? null;
    }
  }}>
    {children}
    <PendingNavigation requestId={requestId} />
  </Link>;
}
