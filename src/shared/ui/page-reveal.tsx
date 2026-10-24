'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const targets = ['main > *', 'main article', '[data-deferred-content]', '[data-reveal="on"]', 'footer > .container'].join(', ');

/** Progressive enhancement: server-rendered content stays readable without JS. */
export function PageReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;

    const tracked = new Map<HTMLElement, Animation>();
    const settled = new WeakSet<HTMLElement>();
    const registered = new Set<HTMLElement>();
    const reveal = (element: HTMLElement) => {
      if (tracked.has(element) || settled.has(element)) return;
      const animation = element.animate([
        { opacity: 0.55, translate: '0 14px' },
        { opacity: 1, translate: '0 0' },
      ], { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      animation.onfinish = () => animation.cancel();
      tracked.set(element, animation);
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    const register = (elements: Iterable<HTMLElement>) => {
      for (const element of elements) {
        if (registered.has(element) || element.closest('[role="dialog"], [aria-modal="true"], [data-reveal="off"]')) continue;
        // Animate completed content, not its loading placeholder or a container
        // around cards that will each enter independently as they reach the view.
        if (element.dataset.deferredSection || element.querySelector('article, [data-deferred-content]')) continue;
        if (typeof element.animate !== 'function') continue;
        // Offscreen and streamed content stays visible even if an observer is delayed.
        registered.add(element);
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
          reveal(element);
        } else if (bounds.bottom <= 0) {
          // Scroll restoration should never leave already-passed content hidden.
          observer.unobserve(element);
        } else {
          observer.observe(element);
        }
      }
    };

    // Include content arriving later through Next.js streaming and client updates.
    const mutations = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        register(node.matches(targets) ? [node] : []);
        register(node.querySelectorAll<HTMLElement>(targets));
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    register(document.querySelectorAll<HTMLElement>(targets));

    const settleAncestors = (element: Element | null) => {
      for (let current = element; current; current = current.parentElement) {
        if (current instanceof HTMLElement && registered.has(current)) {
          // Focus can occur between pointerdown and pointerup. Moving a focused
          // control here changes the click target and silently drops navigation.
          settled.add(current);
          tracked.get(current)?.cancel();
          tracked.delete(current);
          observer.unobserve(current);
        }
      }
    };
    const onFocus = (event: FocusEvent) => settleAncestors(event.target as Element);
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (id) {
        try { settleAncestors(document.getElementById(decodeURIComponent(id))); } catch { /* Invalid URL fragment. */ }
      }
    };
    const onMotionChange = () => {
      if (motion.matches) {
        tracked.forEach(animation => animation.cancel());
        observer.disconnect();
        mutations.disconnect();
      }
    };
    document.addEventListener('focusin', onFocus);
    window.addEventListener('hashchange', onHash);
    motion.addEventListener('change', onMotionChange);
    onHash();

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('hashchange', onHash);
      motion.removeEventListener('change', onMotionChange);
      tracked.forEach(animation => animation.cancel());
    };
  }, [pathname]);

  return null;
}
