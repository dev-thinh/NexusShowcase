import React, { type ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProfileEditor } from '@/features/identity/components/profile-editor';

const mocks = vi.hoisted(() => ({ update: vi.fn(), notify: vi.fn(), refresh: vi.fn(), work: undefined as undefined | Promise<unknown> }));
vi.mock('@/features/identity/server/profile-actions', () => ({ updateProfileAction: mocks.update }));
vi.mock('@/shared/dialogs/success', () => ({ notifySuccess: mocks.notify }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useId: () => 'profile', useState: (initial: unknown) => [initial, vi.fn()],
  useTransition: () => [false, (work: () => unknown) => { mocks.work = Promise.resolve(work()); }],
}));
function form(node: ReactNode): React.ReactElement<Record<string, unknown>> | undefined {
  if (!React.isValidElement<Record<string, unknown>>(node)) return;
  if (node.props.schema && node.props.onSubmit) return node;
  return React.Children.toArray(node.props.children as ReactNode).map(form).find(Boolean);
}
function submit() {
  const tree = ProfileEditor({ profile: { fullName: 'Member', bio: 'Bio', links: [] } });
  (form(tree)!.props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn(), currentTarget: {} });
  return mocks.work;
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.notify.mockResolvedValue(undefined);
  vi.stubGlobal('FormData', class { get(key: string) { return key === 'fullName' ? 'Member' : 'Bio'; } });
});
afterEach(() => vi.unstubAllGlobals());
it('uses the shared success dialog after saving a profile', async () => {
  mocks.update.mockResolvedValue({ success: true });
  await submit();
  expect(mocks.refresh).toHaveBeenCalledOnce();
  expect(mocks.notify).toHaveBeenCalledExactlyOnceWith('Đã cập nhật hồ sơ của bạn.');
});
it('never reports success when the server rejects the update', async () => {
  mocks.update.mockResolvedValue({ success: false, error: 'Không lưu được.' });
  await submit();
  expect(mocks.notify).not.toHaveBeenCalled();
  expect(mocks.refresh).not.toHaveBeenCalled();
});
it('never reports success when the request fails', async () => {
  mocks.update.mockRejectedValue(new Error('Connection failed'));
  await submit();
  expect(mocks.notify).not.toHaveBeenCalled();
});
