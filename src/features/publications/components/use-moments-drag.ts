'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

type Drag = { photoId: string; x: number; y: number; over: number | null; offsetX: number; offsetY: number; width: number; height: number };
type Gesture = Omit<Drag, 'over'> & { startX: number; startY: number; active: boolean; touch: boolean; pointerId: number };

/** Native touch listeners preserve scrolling until a hold activates photo placement. */
export function useMomentsDrag(root: RefObject<HTMLDivElement | null>, disabled: boolean, onDrop: (photoId: string, slot: number) => void) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  useEffect(() => {
    const element = root.current;
    if (!element || disabled) { setDrag(null); return; }
    let gesture: Gesture | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let suppressClickUntil = 0;
    const targetAt = (x: number, y: number) => {
      const target = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-moment-slot]');
      return target && element.contains(target) ? Number(target.dataset.momentSlot) : null;
    };
    const update = () => {
      if (!gesture?.active) return;
      const over = targetAt(gesture.x, gesture.y);
      const next = { photoId: gesture.photoId, x: gesture.x, y: gesture.y, over, offsetX: gesture.offsetX, offsetY: gesture.offsetY, width: gesture.width, height: gesture.height };
      setDrag(current => current?.photoId === next.photoId && current.x === next.x && current.y === next.y && current.over === next.over ? current : next);
    };
    const scrollEdges = () => {
      if (!gesture?.active) return;
      let node = document.elementFromPoint(gesture.x, gesture.y) as HTMLElement | null;
      while (node && element.contains(node)) {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const dx = /auto|scroll/.test(style.overflowX) && node.scrollWidth > node.clientWidth
          ? gesture.x < box.left + 28 ? -7 : gesture.x > box.right - 28 ? 7 : 0 : 0;
        const dy = /auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight
          ? gesture.y < box.top + 28 ? -7 : gesture.y > box.bottom - 28 ? 7 : 0 : 0;
        if (dx || dy) { node.scrollBy(dx, dy); break; }
        node = node.parentElement;
      }
      update();
      frame = requestAnimationFrame(scrollEdges);
    };
    const activate = () => {
      if (!gesture) return;
      gesture.active = true;
      update();
      frame = requestAnimationFrame(scrollEdges);
    };
    const finish = (commit: boolean) => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      const current = gesture;
      gesture = null;
      setDrag(null);
      if (!current?.active) return;
      suppressClickUntil = Date.now() + 350;
      const over = targetAt(current.x, current.y);
      if (commit && over !== null) dropRef.current(current.photoId, over);
    };
    const begin = (target: EventTarget | null, x: number, y: number, touch: boolean, pointerId: number) => {
      if (gesture) finish(false);
      const source = target instanceof Element ? target.closest<HTMLElement>('[data-moment-drag]') : null;
      if (!source || !element.contains(source) || source.matches(':disabled')) return;
      suppressClickUntil = 0;
      const bounds = source.getBoundingClientRect();
      gesture = { photoId: source.dataset.momentDrag!, x, y, startX: x, startY: y, offsetX: x - bounds.left, offsetY: y - bounds.top, width: bounds.width, height: bounds.height, active: false, touch, pointerId };
      // Mouse placement starts only after movement; a stationary press is not a drag.
      if (touch) timer = setTimeout(activate, 350);
    };
    const move = (x: number, y: number) => {
      if (!gesture) return false;
      gesture.x = x; gesture.y = y;
      if (!gesture.active && Math.hypot(x - gesture.startX, y - gesture.startY) > 8) {
        if (gesture.touch) { finish(false); return false; }
        clearTimeout(timer); activate();
      }
      update();
      return gesture?.active ?? false;
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.button === 0 && event.isPrimary) {
        suppressClickUntil = 0;
        begin(event.target, event.clientX, event.clientY, false, event.pointerId);
      }
    };
    const pointerMove = (event: PointerEvent) => {
      if (gesture?.touch || gesture?.pointerId !== event.pointerId) return;
      // Native scrollbar interactions can consume pointerup outside the photo.
      if (!(event.buttons & 1)) { finish(false); return; }
      if (move(event.clientX, event.clientY)) event.preventDefault();
    };
    const pointerUp = (event: PointerEvent) => {
      if (gesture && !gesture.touch && gesture.pointerId === event.pointerId) {
        gesture.x = event.clientX; gesture.y = event.clientY;
        finish(true);
      }
    };
    const pointerCancel = (event: PointerEvent) => { if (gesture && !gesture.touch && gesture.pointerId === event.pointerId) finish(false); };
    const touchStart = (event: TouchEvent) => {
      suppressClickUntil = 0;
      if (event.touches.length !== 1) { finish(false); return; }
      const point = event.touches[0];
      begin(event.target, point.clientX, point.clientY, true, point.identifier);
    };
    const touchMove = (event: TouchEvent) => {
      if (!gesture?.touch) return;
      const point = Array.from(event.touches).find(touch => touch.identifier === gesture!.pointerId);
      if (!point) { finish(false); return; }
      if (move(point.clientX, point.clientY) && event.cancelable) event.preventDefault();
    };
    const touchEnd = (event: TouchEvent) => {
      if (!gesture?.touch) return;
      const point = Array.from(event.changedTouches).find(touch => touch.identifier === gesture!.pointerId);
      if (!point) return;
      gesture.x = point.clientX; gesture.y = point.clientY;
      if (gesture.active && event.cancelable) event.preventDefault();
      finish(true);
    };
    const cancel = () => { if (gesture) finish(false); };
    const click = (event: MouseEvent) => {
      if (event.detail > 0 && Date.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); suppressClickUntil = 0; }
    };
    const context = (event: Event) => { if (gesture) event.preventDefault(); };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && gesture?.active) { event.preventDefault(); event.stopImmediatePropagation(); finish(false); }
    };

    element.addEventListener('pointerdown', pointerDown);
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('click', click, true);
    element.addEventListener('contextmenu', context);
    element.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerCancel);
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', touchEnd, { passive: false });
    window.addEventListener('touchcancel', cancel);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', key, true);
    return () => {
      clearTimeout(timer); cancelAnimationFrame(frame); gesture = null;
      element.removeEventListener('pointerdown', pointerDown);
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('click', click, true);
      element.removeEventListener('contextmenu', context);
      element.removeEventListener('wheel', cancel);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerCancel);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('touchcancel', cancel);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', key, true);
    };
  }, [root, disabled]);
  return drag;
}
