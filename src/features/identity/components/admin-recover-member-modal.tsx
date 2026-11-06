'use client';

import { useI18n } from '@/shared/i18n/provider';
import { KeyRound, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/shared/ui/modal';
import { notifySuccess } from '@/shared/dialogs/success';
import { resetMemberPasswordAction, restoreMemberAction } from '../server/member-actions';

export function AdminRecoverMemberModal({ member }: { member: { id: string; fullName: string; status?: string; deletedAt?: Date | string | null; sessionVersion?: number } }) {
  const { t: tr } = useI18n();

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
      else { setMessage('Đã khôi phục tài khoản.'); void notifySuccess('Đã khôi phục tài khoản.'); }
    } catch {
      // A lost response is uncertain. Never replay with a refreshed version.
      setMessage('Chưa xác định được kết quả thao tác.');
      setDone(true);
    } finally { setBusy(false); }
  }
  if (!member.sessionVersion) return null;
  return <>
    <button type="button" className="admin-recover-trigger inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#1F2937] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]" onClick={() => setOpen(true)}>{disabled ? <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : <KeyRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}{disabled ? tr("Khôi phục") : tr("Đặt lại mật khẩu")}</button>
    <Modal isOpen={open} closeDisabled={busy} onClose={close} title={disabled ? tr("Khôi phục tài khoản") : tr("Đặt lại mật khẩu")} className="!max-w-md">
      {!done && <p className="mb-4 text-sm leading-6 text-slate-600">{disabled ? tr("Khôi phục tài khoản của {0}?", member.fullName) : tr("Đặt lại mật khẩu cho {0}?", member.fullName)}</p>}
      {password && <div className="mb-4 space-y-3">
        <label className="block text-sm">{tr("Mật khẩu tạm")}<input readOnly type={reveal ? 'text' : 'password'} autoComplete="off" value={password} className="mt-2 w-full rounded border border-slate-200 p-2 font-mono" /></label>
        <div className="flex flex-wrap gap-2"><button type="button" className="action-secondary-detail" aria-pressed={reveal} onClick={() => setReveal(value => !value)}>{reveal ? tr("Ẩn mật khẩu") : tr("Hiện mật khẩu")}</button><button type="button" className="action-secondary-detail" onClick={async () => { try { await navigator.clipboard.writeText(password); setMessage('Đã sao chép mật khẩu tạm.'); } catch { setMessage('Không sao chép được mật khẩu.'); } }}>{tr("Sao chép")}</button></div>
      </div>}
      {message && <p role="status" className="mb-4 text-sm">{tr(message)}</p>}
      <div className="modal-footer"><button type="button" disabled={busy} onClick={close} className="action-secondary-detail">{done ? tr("Đóng") : tr("Hủy")}</button>{!done && <button type="button" disabled={busy} onClick={recover} className="action-primary-detail">{busy ? tr("Đang xử lý…") : tr("Xác nhận")}</button>}</div>
    </Modal>
  </>;
}
