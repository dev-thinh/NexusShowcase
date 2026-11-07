'use client';

import { useI18n } from '@/shared/i18n/provider';
import { deleteMemberAction } from '../server/member-actions';
import { manageMemberAccountsAction } from '../server/member-lifecycle-actions';
import type { Role } from '@prisma/client';
import { Loader2, Trash2, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Modal } from '@/shared/ui/modal';
import { notifySuccess } from '@/shared/dialogs/success';

export function AdminDeleteMemberModal({ member, permanent = false }: { permanent?: boolean; member: { id: string; fullName: string; role: Role; sessionVersion?: number } }) {
  const { t: tr } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  if (member.role === 'ADMIN') return null;
  const apply = async () => {
    if (locked.current || permanent && (confirmation !== 'DELETE' || !member.sessionVersion)) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = permanent
        ? await manageMemberAccountsAction({ operation: 'DELETE', members: [{ id: member.id, expectedVersion: member.sessionVersion }] })
        : await deleteMemberAction(member.id);
      if (!result.success) { setError(result.error); return; }
      setOpen(false); router.refresh();
      await notifySuccess(permanent ? 'Đã xóa vĩnh viễn tài khoản của {0}.' : 'Đã vô hiệu hóa tài khoản của {0}.', member.fullName);
    } catch { setError('Không kết nối được. Vui lòng thử lại.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <>
    <button type="button" disabled={permanent && !member.sessionVersion} onClick={() => { setError(''); setConfirmation(''); setOpen(true); }} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-[#1F2937] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:opacity-50 sm:min-h-9 sm:min-w-0" title={permanent ? tr('Xóa tài khoản') : tr('Vô hiệu hóa tài khoản')} aria-label={permanent ? tr('Xóa tài khoản {0}', member.fullName) : tr('Vô hiệu hóa tài khoản {0}', member.fullName)}>
      {permanent ? <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> : <UserX aria-hidden="true" className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{permanent ? tr('Xóa tài khoản') : tr('Vô hiệu hóa')}</span>
    </button>
    <Modal isOpen={open} closeDisabled={busy} onClose={() => { if (!locked.current) setOpen(false); }} title={permanent ? tr('Xác nhận xóa tài khoản') : tr('Vô hiệu hóa tài khoản')} className="!max-w-md">
      <p className="mb-3 break-words text-left font-semibold">{member.fullName}</p>
      <p className="mb-4 text-left text-sm leading-6 text-slate-600">{permanent ? tr('Tài khoản sẽ bị xóa vĩnh viễn và không thể khôi phục. Bài đăng được giữ lại; họ tên tác giả chuyển thành người đóng góp ngoài CLB.') : tr('Các tài khoản được chọn sẽ không thể đăng nhập. Bài đăng vẫn được giữ lại và có thể khôi phục tài khoản sau này.')}</p>
      {permanent && <label className="block text-left text-sm">{tr('Nhập DELETE để xác nhận')}<input value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3" /></label>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{tr(error)}</p>}
      <div className="modal-footer"><button type="button" disabled={busy} onClick={() => setOpen(false)} className="action-secondary-detail">{tr('Hủy bỏ')}</button><button type="button" disabled={busy || permanent && confirmation !== 'DELETE'} onClick={() => void apply()} className="action-primary-detail">{busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{busy ? tr('Đang xử lý…') : permanent ? tr('Xóa vĩnh viễn') : tr('Vô hiệu hóa')}</button></div>
    </Modal>
  </>;
}
