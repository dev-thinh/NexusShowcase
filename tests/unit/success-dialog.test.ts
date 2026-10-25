import { afterEach, expect, it, vi } from 'vitest';
import { notifySuccess, SUCCESS_EVENT, type SuccessRequest } from '@/shared/dialogs/success';
afterEach(() => vi.unstubAllGlobals());
it('waits for the shared provider acknowledgement before completing an action', async () => {
  const target = new EventTarget(); vi.stubGlobal('window', target);
  let request: SuccessRequest | undefined;
  target.addEventListener(SUCCESS_EVENT, event => { event.preventDefault(); request = (event as CustomEvent<SuccessRequest>).detail; });
  const done = vi.fn(); const notification = notifySuccess('Đã cập nhật hồ sơ.').then(done);
  await Promise.resolve();
  expect(request?.message).toBe('Đã cập nhật hồ sơ.'); expect(done).not.toHaveBeenCalled();
  request!.resolve(); await notification; expect(done).toHaveBeenCalledOnce();
});
it('does not leave standalone or unmounted actions pending', async () => {
  vi.stubGlobal('window', new EventTarget());
  await expect(notifySuccess('Đã lưu.')).resolves.toBeUndefined();
});
