'use client';

import { useNavigationTransition } from '@/shared/navigation/navigation-transition';
import Link, { useLinkStatus } from 'next/link';
import { useEffect, useRef, type ComponentProps } from 'react';

function PendingNavigation({ requestId }: { requestId: { current: number | null } }) {
  const { pending } = useLinkStatus();
  const navigation = useNavigationTransition();
  const finish = navigation?.finish;
  const wasPending = useRef(false);
  // A filter reset can remove its own link when the new results commit.
  // Release its request even when useLinkStatus cannot render pending=false.
  useEffect(() => () => {
    if (requestId.current !== null) {
      finish?.(requestId.current);
      requestId.current = null;
    }
  }, [finish, requestId]);
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
    <span role="status" className="sr-only">Đang chuyển trang…</span>
  </>;
}

/** Preserve native navigation, prefetch, history and modified-click behavior. */
function navigationHref(href: ComponentProps<typeof Link>['href']): string {
  if (typeof href === 'string') return href;
  const query = new URLSearchParams();
  if (typeof href.query === 'string') {
    for (const [key, value] of new URLSearchParams(href.query)) query.append(key, value);
  } else {
    for (const [key, value] of Object.entries(href.query ?? {})) {
      for (const entry of Array.isArray(value) ? value : [value]) if (entry !== undefined && entry !== null) query.append(key, String(entry));
    }
  }
  const search = href.search || (query.size ? `?${query}` : '');
  return `${href.pathname ?? ''}${search}${href.hash ?? ''}`;
}

export function NavigationLink({ children, className = '', onNavigate, href, prefetch = false, ...props }: ComponentProps<typeof Link>) {
  const navigation = useNavigationTransition();
  const requestId = useRef<number | null>(null);
  return <Link {...props} href={href} prefetch={prefetch} className={`relative ${className}`} onNavigate={event => {
    let cancelled = false;
    onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
    if (!cancelled) {
      const target = navigationHref(href);
      if (navigation?.navigate?.(target, { replace: props.replace, scroll: props.scroll })) {
        event.preventDefault();
        return;
      }
      requestId.current = (props.scroll === false ? navigation?.begin(target, false) : navigation?.begin(target)) ?? null;
    }
  }}>
    {children}
    <PendingNavigation requestId={requestId} />
  </Link>;
}
