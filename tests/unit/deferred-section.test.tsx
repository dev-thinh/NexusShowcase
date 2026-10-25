import { afterEach, expect, it, vi } from 'vitest';
import { DeferredSection } from '@/shared/ui/deferred-section';
const hooks = vi.hoisted(() => ({ effect: null as null | (() => void | (() => void)) }));
vi.mock('react', () => ({ useRef: (value: unknown) => ({ current: value }), useState: (value: unknown) => [value, vi.fn()], useCallback: (callback: unknown) => callback, useEffect: (effect: () => void | (() => void)) => { hooks.effect = effect; } }));
afterEach(() => vi.unstubAllGlobals());

it('starts a section on mount without waiting for an intersection and aborts it on unmount', () => {
  const load = vi.fn((_signal: AbortSignal) => new Promise<null>(() => {}));
  vi.stubGlobal('window', { IntersectionObserver: class {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  DeferredSection({ name: 'photos', load, fallback: null });
  const cleanup = hooks.effect!();
  expect(load).toHaveBeenCalledOnce();
  const signal = load.mock.calls[0][0] as AbortSignal;
  expect(signal.aborted).toBe(false);
  if (typeof cleanup === 'function') cleanup();
  expect(signal.aborted).toBe(true);
});
