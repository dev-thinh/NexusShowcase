import React, { type ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HomeMemberWall } from '@/features/members/components/home-member-wall';

const hooks = vi.hoisted(() => ({ active: null as unknown, effect: undefined as (() => void | (() => void)) | undefined }));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useId: () => 'member-tooltip',
  useState: () => [hooks.active, (value: unknown) => { hooks.active = value; }],
  useEffect: (effect: typeof hooks.effect) => { hooks.effect = effect; },
}));
vi.mock('react-dom', () => ({ createPortal: (node: ReactNode) => node }));

const listeners = new Map<string, () => void>();
const viewport = { innerWidth: 390, innerHeight: 844, scrollX: 0, scrollY: 100, addEventListener: (type: string, listener: () => void) => listeners.set(type, listener), removeEventListener: vi.fn() };
const member = { id: 'm0', fullName: 'Member 0', avatarUrl: null, role: 'ADMIN' as const };

beforeEach(() => {
  hooks.active = null;
  listeners.clear();
  viewport.scrollY = 100;
  vi.stubGlobal('window', viewport);
  vi.stubGlobal('document', { body: {}, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

function openTooltip() {
  const findButton = (node: ReactNode): React.ReactElement<Record<string, unknown>> | undefined => {
    if (!React.isValidElement<Record<string, unknown>>(node)) return;
    if (node.props['data-home-member-avatar']) return node;
    return React.Children.toArray(node.props.children as ReactNode).map(findButton).find(Boolean);
  };
  const button = findButton(HomeMemberWall({ members: [member], total: 1 }))!;
  expect(button.props.href).toBe('/members/m0');
  (button.props.onFocus as (event: unknown) => void)({ currentTarget: { getBoundingClientRect: () => ({ top: 200, bottom: 268, left: 80, width: 68 }) } });
  HomeMemberWall({ members: [member], total: 1 });
  hooks.effect?.();
}

it('keeps a newly opened tooltip when a queued scroll event reports its current viewport', () => {
  openTooltip();
  listeners.get('scroll')?.();
  expect(hooks.active).not.toBeNull();
});

it('dismisses the tooltip when the visitor actually scrolls away', () => {
  openTooltip();
  viewport.scrollY += 30;
  listeners.get('scroll')?.();
  expect(hooks.active).toBeNull();
});

it('closes the tooltip on navigation without blocking the profile link', () => {
  openTooltip();
  function findAvatar(node: ReactNode): React.ReactElement<Record<string, unknown>> | undefined {
    if (!React.isValidElement<Record<string, unknown>>(node)) return;
    if (node.props['data-home-member-avatar']) return node;
    return React.Children.toArray(node.props.children as ReactNode).map(findAvatar).find(Boolean);
  }
  const avatar = findAvatar(HomeMemberWall({ members: [member], total: 1 }))!;
  expect(avatar.props.href).toBe('/members/m0');
  (avatar.props.onClick as () => void)();
  expect(hooks.active).toBeNull();
});
