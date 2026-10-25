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
    const registered = new WeakSet<HTMLElement>();
    const pressed = new Set<Animation>();
    let pointerActive = false;
    let resumeFrame = 0;
    const entryInset = Math.min(120, Math.round(window.innerHeight * 0.15));
    const reveal = (element: HTMLElement) => {
      if (tracked.has(element) || settled.has(element)) return;
      const animation = element.animate([
        { opacity: 0.35, translate: '0 24px' },
        { opacity: 1, translate: '0 0' },
      ], { delay: 100, duration: 600, fill: 'backwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      animation.onfinish = () => {
        settled.add(element);
        tracked.delete(element);
        animation.cancel();
      };
      tracked.set(element, animation);
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    }, { threshold: 0, rootMargin: `0px 0px -${entryInset}px 0px` });

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
        if (bounds.top < window.innerHeight - entryInset && bounds.bottom > 0) {
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
          if (pointerActive && tracked.has(current)) continue;
          // Focus can occur between pointerdown and pointerup. Moving a focused
          // control here changes the click target and silently drops navigation.
          settled.add(current);
          tracked.get(current)?.cancel();
          tracked.delete(current);
          observer.unobserve(current);
        }
      }
    };
    // Keep the hit target stationary between pointerdown, focus and click.
    // Cancelling a translated ancestor during focus moves the control away
    // before pointerup, so the browser never dispatches its click handler.
    const onPointerDown = (event: PointerEvent) => {
      pointerActive = true;
      for (let current = event.target as Element | null; current; current = current.parentElement) {
        const animation = current instanceof HTMLElement ? tracked.get(current) : undefined;
        if (animation?.playState === 'running') { animation.pause(); pressed.add(animation); }
      }
      settleAncestors(event.target as Element);
    };
    const onPointerEnd = () => {
      pointerActive = false;
      cancelAnimationFrame(resumeFrame);
      resumeFrame = requestAnimationFrame(() => {
        pressed.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
        pressed.clear();
      });
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
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerEnd, true);
    document.addEventListener('pointercancel', onPointerEnd, true);
    window.addEventListener('hashchange', onHash);
    motion.addEventListener('change', onMotionChange);
    onHash();

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerEnd, true);
      document.removeEventListener('pointercancel', onPointerEnd, true);
      cancelAnimationFrame(resumeFrame);
      window.removeEventListener('hashchange', onHash);
      motion.removeEventListener('change', onMotionChange);
      tracked.forEach(animation => animation.cancel());
    };
  }, [pathname]);

  return null;
}
