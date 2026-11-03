import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { scrollToTop } from '@/shared/navigation/scroll-to-top';

beforeEach(() => {
  vi.stubGlobal('window', { scrollY: 600, scrollTo: vi.fn(), matchMedia: () => ({ matches: false }), addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockReturnValue(100);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each([600, 2400])('uses the same 600ms easing from a scroll distance of %i', start => {
  Object.assign(window, { scrollY: start });
  const cancel = scrollToTop();
  vi.mocked(requestAnimationFrame).mock.calls[0][0](100);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: start, left: 0, behavior: 'instant' });
  vi.mocked(requestAnimationFrame).mock.calls[1][0](400);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: start / 8, left: 0, behavior: 'instant' });
  vi.mocked(requestAnimationFrame).mock.calls[2][0](700);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
  expect(requestAnimationFrame).toHaveBeenCalledTimes(3);
  cancel();
});

it('skips animation when reduced motion is requested', () => {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
  scrollToTop();
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
});

it('lets a new gesture interrupt the animation', () => {
  const cancel = scrollToTop();
  const wheel = vi.mocked(window.addEventListener).mock.calls.find(([name]) => name === 'wheel')![1] as () => void;
  wheel();
  expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  expect(window.removeEventListener).toHaveBeenCalledWith('wheel', wheel);
  cancel();
});
