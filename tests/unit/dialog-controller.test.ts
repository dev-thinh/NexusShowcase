import { describe, expect, it, vi } from 'vitest';
import { createDialogController } from '@/lib/dialog-controller';

const request = (title: string) => ({ mode: 'confirm' as const, title, message: 'Xác nhận thao tác.' });

describe('application dialogs', () => {
  it('waits for a decision before allowing an action', async () => {
    const change = vi.fn();
    const action = vi.fn();
    const dialog = createDialogController(change);
    const answer = dialog.open(request('Xuất bản'));
    const completed = answer.then(accepted => { if (accepted) action(); });
    await Promise.resolve();
    expect(action).not.toHaveBeenCalled();
    expect(change).toHaveBeenLastCalledWith(request('Xuất bản'));
    dialog.settle(true);
    await completed;
    expect(action).toHaveBeenCalledOnce();
    expect(change).toHaveBeenLastCalledWith(null);
  });
  it('cancels without running a destructive action', async () => {
    const dialog = createDialogController(vi.fn());
    const answer = dialog.open({ ...request('Xóa section'), destructive: true });
    dialog.settle(false);
    await expect(answer).resolves.toBe(false);
    dialog.settle(true);
  });
  it('queues simultaneous requests rather than losing their responses', async () => {
    const change = vi.fn();
    const dialog = createDialogController(change);
    const first = dialog.open(request('Gửi duyệt'));
    const second = dialog.open({ ...request('Lỗi kết nối'), mode: 'alert' });
    expect(change).toHaveBeenCalledTimes(1);
    dialog.settle(false);
    await expect(first).resolves.toBe(false);
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Lỗi kết nối', mode: 'alert' }));
    dialog.settle(true);
    await expect(second).resolves.toBe(true);
  });
  it('resolves pending requests as cancelled when leaving a page', async () => {
    const change = vi.fn();
    const dialog = createDialogController(change);
    const first = dialog.open(request('Rút bài'));
    const second = dialog.open(request('Xóa nội dung'));
    dialog.cancelAll();
    await expect(Promise.all([first, second])).resolves.toEqual([false, false]);
    expect(change).toHaveBeenLastCalledWith(null);
    const next = dialog.open(request('Yêu cầu mới'));
    dialog.settle(true);
    await expect(next).resolves.toBe(true);
  });
});
