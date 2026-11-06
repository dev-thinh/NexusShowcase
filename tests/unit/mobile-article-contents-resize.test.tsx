import { afterEach, expect, it, vi } from 'vitest';
import { MobileArticleContents } from '@/features/submissions/components/mobile-article-contents';

const state = vi.hoisted(() => ({ effect: undefined as (() => (() => void) | void) | undefined, panel: { current: null as unknown } }));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useId: () => 'contents-resize',
  useRef: () => state.panel,
  useEffect: (effect: () => (() => void) | void) => { state.effect = effect; },
}));
afterEach(() => { vi.unstubAllGlobals(); state.panel.current = null; });

it('closes an open popover for a queued desktop event even after returning to mobile', () => {
  let open = true;
  const hidePopover = vi.fn(() => { open = false; });
  state.panel.current = { matches: () => open, hidePopover };
  let listener: ((event: { matches: boolean }) => void) | undefined;
  const removeEventListener = vi.fn();
  vi.stubGlobal('window', { matchMedia: () => ({
    matches: false,
    addEventListener: (_type: string, callback: typeof listener) => { listener = callback; },
    removeEventListener,
  }) });
  MobileArticleContents({ children: null });
  const cleanup = state.effect?.();
  listener?.({ matches: true });
  expect(hidePopover).toHaveBeenCalledOnce();
  listener?.({ matches: false });
  expect(hidePopover).toHaveBeenCalledOnce();
  cleanup?.();
  expect(removeEventListener).toHaveBeenCalledWith('change', listener);
});
