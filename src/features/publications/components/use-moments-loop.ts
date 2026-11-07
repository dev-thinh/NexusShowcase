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
      const lanes = [...(wall.current?.querySelectorAll<HTMLElement>('.moments-lane[data-motion="true"]') ?? [])];
      const disposers = lanes.map(lane => {
        const group = lane.querySelector<HTMLElement>('.moments-group');
        if (!group) return () => {};
        let frame = 0;
        let last = 0;
        let remainder = 0;
        let touching = false;
        let resumeAt = 0;
        const period = () => group.getBoundingClientRect().width;
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
          const elapsed = last ? Math.min(now - last, 50) : 0;
          last = now;
          if (!paused && !touching && now >= resumeAt && !document.hidden) {
            remainder += elapsed * (lane.dataset.row === '1' ? -0.025 : 0.03);
            const step = Math.trunc(remainder);
            lane.scrollLeft += step;
            remainder -= step;
          }
          wrap();
          frame = requestAnimationFrame(tick);
        };
        lane.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', up, { passive: true });
        lane.addEventListener('wheel', wheel, { passive: true });
        lane.addEventListener('scroll', wrap, { passive: true });
        frame = requestAnimationFrame(tick);
        return () => {
          cancelAnimationFrame(frame);
          lane.removeEventListener('pointerdown', down);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          lane.removeEventListener('wheel', wheel);
          lane.removeEventListener('scroll', wrap);
        };
      });
      cleanup = () => disposers.forEach(dispose => dispose());
    };
    setup();
    mobile.addEventListener('change', setup);
    reduced.addEventListener('change', setup);
    return () => { cleanup(); mobile.removeEventListener('change', setup); reduced.removeEventListener('change', setup); };
  }, [wall, paused, keyboardBrowsing, version]);
}
