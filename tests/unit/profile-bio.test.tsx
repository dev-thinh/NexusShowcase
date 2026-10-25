import React, { type ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProfileBio } from '@/features/identity/components/profile-bio';

const hooks = vi.hoisted(() => ({
  state: [false, false], index: 0, effect: undefined as undefined | (() => void | (() => void)),
  resize: undefined as undefined | (() => void), disconnect: vi.fn(),
  element: { scrollHeight: 24, scrollWidth: 240, clientWidth: 240 },
}));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useId: () => 'profile-bio',
  useRef: () => ({ current: hooks.element }),
  useState: () => { const index = hooks.index++; return [hooks.state[index], (value: boolean) => { hooks.state[index] = value; }]; },
  useEffect: (effect: typeof hooks.effect) => { hooks.effect = effect; },
}));

function render() { hooks.index = 0; return ProfileBio({ text: 'Giới thiệu của tôi' }); }
function button(node: ReactNode): React.ReactElement<Record<string, unknown>> | undefined {
  if (!React.isValidElement<Record<string, unknown>>(node)) return;
  if (node.type === 'button') return node;
  return React.Children.toArray(node.props.children as ReactNode).map(button).find(Boolean);
}
beforeEach(() => {
  hooks.state = [false, false]; hooks.element.scrollHeight = 24; hooks.resize = undefined; hooks.disconnect.mockClear();
  vi.stubGlobal('window', { getComputedStyle: () => ({ lineHeight: '24px' }), addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('document', {});
  vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { hooks.resize = callback; } observe() {} disconnect() { hooks.disconnect(); } });
});
afterEach(() => vi.unstubAllGlobals());

it('keeps a short biography as plain text without an expansion control', () => {
  render(); hooks.effect?.();
  expect(button(render())).toBeUndefined();
});
it('offers expansion only when the biography needs more than one line', () => {
  hooks.element.scrollHeight = 48;
  render(); hooks.effect?.();
  const expand = button(render())!;
  expect(expand.props['aria-expanded']).toBe(false);
  expect(expand.props.children).toBe('Xem thêm');
  (expand.props.onClick as () => void)();
  const collapse = button(render())!;
  expect(collapse.props['aria-expanded']).toBe(true);
  expect(collapse.props.children).toBe('Thu gọn');
  (collapse.props.onClick as () => void)();
  expect(button(render())!.props['aria-expanded']).toBe(false);
});
it('removes the control when resizing gives the biography enough room', () => {
  hooks.element.scrollHeight = 48;
  render(); const cleanup = hooks.effect?.();
  expect(button(render())).toBeDefined();
  hooks.element.scrollHeight = 24;
  hooks.resize?.();
  expect(button(render())).toBeUndefined();
  if (typeof cleanup === 'function') cleanup();
  expect(hooks.disconnect).toHaveBeenCalledOnce();
});
