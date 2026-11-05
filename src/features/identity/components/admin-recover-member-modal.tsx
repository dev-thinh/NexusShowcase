'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/shared/ui/modal';
import { notifySuccess } from '@/shared/dialogs/success';
import { resetMemberPasswordAction, restoreMemberAction } from '../server/member-actions';

export function AdminRecoverMemberModal({ member }: { member: { id: string; fullName: string; status?: string; deletedAt?: Date | string | null; sessionVersion?: number } }) {
  const router = useRouter();
  const disabled = !!member.deletedAt || (!!member.status && member.status !== 'ACTIVE');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [message, setMessage] = useState('');
  const close = () => {
    if (busy) return;
    setOpen(false); setPassword(''); setReveal(false); setMessage(''); setDone(false);
    router.refresh();
  };
  async function recover() {
    if (!member.sessionVersion) return;
    setBusy(true); setMessage('');
    try {
      const input = { targetUserId: member.id, expectedVersion: member.sessionVersion };
      const result = await (disabled ? restoreMemberAction(input) : resetMemberPasswordAction(input));
      if (!result.success) { setMessage(result.error); return; }
      setDone(true);
      if ('temporaryPassword' in result.data && result.data.temporaryPassword) setPassword(result.data.temporaryPassword);
      else { setMessage('Đã khôi phục tài khoản. Có thể đặt lại mật khẩu nếu thành viên cần.'); void notifySuccess('Đã khôi phục tài khoản.'); }
    } catch {
      // A lost response is uncertain. Never replay with a refreshed version.
      setMessage('Chưa xác định được kết quả. Đóng và tải lại danh sách để kiểm tra trước khi thao tác tiếp.');
      setDone(true);
    } finally { setBusy(false); }
  }
  if (!member.sessionVersion) return null;
  return <>
    <button type="button" className="action-secondary-detail min-h-11 text-xs" onClick={() => setOpen(true)}>{disabled ? 'Khôi phục' : 'Đặt lại mật khẩu'}</button>
    <Modal isOpen={open} closeDisabled={busy} onClose={close} title={disabled ? 'Khôi phục tài khoản' : 'Đặt lại mật khẩu'} description={member.fullName} className="!max-w-md">
      <p className="mb-4 text-sm">{disabled ? 'Khôi phục quyền đăng nhập và giữ nguyên công trình, lịch sử của thành viên. Các phiên đăng nhập cũ tiếp tục bị thu hồi.' : 'Mật khẩu hiện tại sẽ bị thay thế và mọi phiên đăng nhập bị thu hồi. Gửi mật khẩu tạm qua kênh riêng sau khi xác minh thành viên. Thành viên phải đổi mật khẩu sau lần đăng nhập đầu tiên.'}</p>
      {password && <div className="mb-4 space-y-3">
        <p className="text-sm font-semibold">Lưu mật khẩu tạm trước khi đóng. Mật khẩu chỉ được hiển thị trong lần này và chỉ dùng đăng nhập một lần.</p>
        <label className="block text-sm">Mật khẩu tạm<input readOnly type={reveal ? 'text' : 'password'} autoComplete="off" value={password} className="mt-2 w-full rounded border border-slate-200 p-2 font-mono" /></label>
        <div className="flex flex-wrap gap-2"><button type="button" className="action-secondary-detail" aria-pressed={reveal} onClick={() => setReveal(value => !value)}>{reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button><button type="button" className="action-secondary-detail" onClick={async () => { try { await navigator.clipboard.writeText(password); setMessage('Đã sao chép mật khẩu tạm.'); } catch { setMessage('Không sao chép được. Hãy hiện và sao chép mật khẩu thủ công.'); } }}>Sao chép</button></div>
      </div>}
      {message && <p role="status" className="mb-4 text-sm">{message}</p>}
      <div className="modal-footer"><button type="button" disabled={busy} onClick={close} className="action-secondary-detail">{done ? 'Đóng' : 'Hủy'}</button>{!done && <button type="button" disabled={busy} onClick={recover} className="action-primary-detail">{busy ? 'Đang xử lý…' : disabled ? 'Khôi phục tài khoản' : 'Tạo mật khẩu tạm'}</button>}</div>
    </Modal>
  </>;
}
