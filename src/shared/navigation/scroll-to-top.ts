let cancelActive: (() => void) | undefined;

/** A fixed duration keeps short and long returns consistent across the app. */
export function scrollToTop() {
  cancelActive?.();
  const start = window.scrollY;
  if (start <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return () => {};
  }
  const started = performance.now();
  let frame = 0;
  const cancel = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', keyboard);
    if (cancelActive === cancel) cancelActive = undefined;
  };
  const keyboard = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancel();
  };
  const tick = (now: number) => {
    const progress = Math.min(1, Math.max(0, (now - started) / 600));
    const eased = 1 - Math.pow(1 - progress, 3);
    window.scrollTo({ top: progress === 1 ? 0 : start * (1 - eased), left: 0, behavior: 'instant' });
    if (progress < 1) frame = requestAnimationFrame(tick);
    else cancel();
  };
  cancelActive = cancel;
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', keyboard);
  frame = requestAnimationFrame(tick);
  return cancel;
}
