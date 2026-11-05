import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { DialogProvider } from '@/shared/dialogs/dialog-provider';
import { notifySuccess } from '@/shared/dialogs/success';

const mocks = vi.hoisted(() => ({ open: vi.fn(() => new Promise<boolean>(() => {})), setState: vi.fn(), cleanup: [] as Array<() => void> }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/shared/dialogs/controller', () => ({ createDialogController: () => ({ open: mocks.open, cancelAll: vi.fn() }) }));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useState: (value: unknown) => [value, mocks.setState], useRef: () => ({ current: null }),
  useEffect: (fn: () => (() => void) | void) => { const cleanup = fn(); if (cleanup) mocks.cleanup.push(cleanup); },
  useCallback: (fn: unknown) => fn, useMemo: (fn: () => unknown) => fn(),
}));
afterEach(() => { mocks.cleanup.splice(0).forEach(fn => fn()); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('settles routine success immediately and never opens a modal', async () => {
  vi.stubGlobal('window', new EventTarget());
  DialogProvider({ children: React.createElement('div') });
  const complete = vi.fn();
  void notifySuccess('Đã lưu.').then(complete);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(complete).toHaveBeenCalledOnce();
  expect(mocks.open).not.toHaveBeenCalled();
  expect(mocks.setState).toHaveBeenCalled();
});
