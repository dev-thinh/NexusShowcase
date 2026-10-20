'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const targets = ['main > *', 'footer > .container'].join(', ');

/** Progressive enhancement: server-rendered content stays readable without JS. */
export function PageReveal() {
  const pathname = usePathname();
  const initialPathname = useRef<string | null>(pathname);

  useEffect(() => {
    // Route changes should show their content without replaying entrance animations.
    if (pathname !== initialPathname.current) {
      initialPathname.current = null;
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;

    const tracked = new Map<HTMLElement, Animation>();
    const reveal = (element: HTMLElement) => {
      const animation = tracked.get(element);
      if (animation?.playState === 'paused') animation.play();
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    const register = () => {
      document.querySelectorAll<HTMLElement>(targets).forEach(element => {
        if (tracked.has(element) || element.closest('[role="dialog"], [aria-modal="true"], [data-reveal="off"]')) return;
        if (typeof element.animate !== 'function') return;
        const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
        // Web Animations leave React's HTML attributes untouched during streaming hydration.
        const animation = element.animate([
          { opacity: 0, translate: '0 16px' },
          { opacity: 1, translate: '0 0' },
        ], {
          duration: 240,
          delay: Math.max(0, Math.min(index, 2)) * 25,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });
        animation.pause();
        animation.onfinish = () => animation.cancel();
        tracked.set(element, animation);
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
          reveal(element);
        } else if (bounds.bottom <= 0) {
          // Scroll restoration should never leave already-passed content hidden.
          animation.cancel();
        } else {
          observer.observe(element);
        }
      });
    };

    // Include content arriving later through Next.js streaming and client updates.
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    register();

    const revealAncestors = (element: Element | null) => {
      for (let current = element; current; current = current.parentElement) {
        if (current instanceof HTMLElement && tracked.has(current)) reveal(current);
      }
    };
    const onFocus = (event: FocusEvent) => revealAncestors(event.target as Element);
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (id) {
        try { revealAncestors(document.getElementById(decodeURIComponent(id))); } catch { /* Invalid URL fragment. */ }
      }
    };
    const onMotionChange = () => {
      if (motion.matches) {
        tracked.forEach(animation => animation.cancel());
        observer.disconnect();
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
