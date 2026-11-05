'use client';

import { useLayoutEffect, useRef } from 'react';

type GuardedNavigationEvent = Event & { downloadRequest?: string | null; hashChange?: boolean; destination?: { url: string } };

/** Keep one-time credentials in this modal until downloaded or explicitly discarded. */
export function useCredentialNavigationGuard(protect: boolean, onBlocked: () => void) {
  const blocked = useRef(onBlocked);
  useLayoutEffect(() => { blocked.current = onBlocked; }, [onBlocked]);
  useLayoutEffect(() => {
    if (!protect) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.hasAttribute('download') || link.target && link.target !== '_self' || link.href === location.href || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); event.stopImmediatePropagation(); blocked.current();
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);

    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    let releaseHistory = () => {};
    if (navigation) {
      const guard = (event: Event) => {
        const change = event as GuardedNavigationEvent;
        if (!change.cancelable || change.downloadRequest != null || change.hashChange || change.destination?.url === location.href) return;
        change.preventDefault(); blocked.current();
      };
      navigation.addEventListener('navigate', guard);
      releaseHistory = () => navigation.removeEventListener('navigate', guard);
    } else {
      // Older browsers cannot cancel a popstate. An owned duplicate entry keeps
      // a single Back on this page; preserve Next's existing history metadata.
      const token = crypto.randomUUID();
      const state = history.state;
      const url = location.href;
      const push = () => history.pushState({ ...state, memberCredentialGuard: token }, '', url);
      const back = (event: PopStateEvent) => {
        event.stopImmediatePropagation(); push(); blocked.current();
      };
      push();
      window.addEventListener('popstate', back, true);
      releaseHistory = () => {
        window.removeEventListener('popstate', back, true);
        if (history.state?.memberCredentialGuard === token) history.back();
      };
    }
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', click, true);
      releaseHistory();
    };
  }, [protect]);
}
