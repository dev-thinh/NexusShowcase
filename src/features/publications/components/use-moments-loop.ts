'use client';

import { useEffect, type RefObject } from 'react';

/** Native touch scrolling and automatic drift share the same circular scroll position. */
export function useMomentsLoop(wall: RefObject<HTMLElement | null>, paused: boolean, keyboardBrowsing: boolean, version: number) {
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (!mobile.matches || reduced.matches || keyboardBrowsing) return;
      const root = wall.current;
      const lanes = [...(root?.querySelectorAll<HTMLElement>('.moments-lane[data-motion="true"]') ?? [])];
      let inView = true;
      const controllers = lanes.map(lane => {
        const group = lane.querySelector<HTMLElement>('.moments-group');
        if (!group) return { sync: () => {}, dispose: () => {} };
        let frame = 0;
        let last = 0;
        let remainder = 0;
        let touching = false;
        let resumeAt = 0;
        let cachedWidth = group.getBoundingClientRect().width;
        const resizeObserver = typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => { cachedWidth = group.getBoundingClientRect().width; })
          : null;
        resizeObserver?.observe(group);
        const period = () => cachedWidth || group.getBoundingClientRect().width;
        if (lane.scrollLeft <= 0) lane.scrollLeft = period();
        const wrap = () => {
          const width = period();
          if (!width) return;
          if (lane.scrollLeft < width / 2) lane.scrollLeft += width;
          else if (lane.scrollLeft > width * 1.5) lane.scrollLeft -= width;
        };
        const down = () => { touching = true; };
        const up = () => { touching = false; resumeAt = performance.now() + 1200; };
        const wheel = () => { resumeAt = performance.now() + 1200; };
        const tick = (now: number) => {
          frame = 0;
          if (!inView) return;
          const elapsed = last ? Math.min(now - last, 50) : 0;
          last = now;
          if (!paused && !touching && now >= resumeAt && !document.hidden) {
            remainder += elapsed * (lane.dataset.row === '1' ? -0.025 : 0.03);
            const step = Math.trunc(remainder);
            if (step !== 0) {
              lane.scrollLeft += step;
              remainder -= step;
            }
          }
          wrap();
          frame = requestAnimationFrame(tick);
        };
        const sync = () => {
          if (inView && !frame) {
            last = 0;
            frame = requestAnimationFrame(tick);
          } else if (!inView && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        };
        lane.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', up, { passive: true });
        lane.addEventListener('wheel', wheel, { passive: true });
        lane.addEventListener('scroll', wrap, { passive: true });
        sync();
        return {
          sync,
          dispose: () => {
            if (frame) cancelAnimationFrame(frame);
            resizeObserver?.disconnect();
            lane.removeEventListener('pointerdown', down);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            lane.removeEventListener('wheel', wheel);
            lane.removeEventListener('scroll', wrap);
          },
        };
      });
      const visibilityObserver = root && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            if (!entry) return;
            inView = entry.isIntersecting;
            controllers.forEach(controller => controller.sync());
          })
        : null;
      if (root) visibilityObserver?.observe(root);
      cleanup = () => {
        visibilityObserver?.disconnect();
        controllers.forEach(controller => controller.dispose());
      };
    };
    setup();
    mobile.addEventListener('change', setup);
    reduced.addEventListener('change', setup);
    return () => { cleanup(); mobile.removeEventListener('change', setup); reduced.removeEventListener('change', setup); };
  }, [wall, paused, keyboardBrowsing, version]);
}
