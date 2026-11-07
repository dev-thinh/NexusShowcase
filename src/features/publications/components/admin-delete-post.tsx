'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { useI18n } from '@/shared/i18n/provider';
import { deletePublishedPostAction } from '../server/delete-action';

export function AdminDeletePost({ itemId, title, expectedVersion }: { itemId: string; title: string; expectedVersion: number }) {
  const { t: tr } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState('');
  const apply = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = await deletePublishedPostAction({ itemId, expectedVersion });
      if (!result.success) { setError(result.error); return; }
      setOpen(false); router.refresh();
    } catch { setError('Không kết nối được. Vui lòng thử lại.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <>
    <button type="button" className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50" aria-label={tr('Xóa bài đăng {0}', title)} title={tr('Xóa bài đăng')} onClick={() => { setError(''); setOpen(true); }}><Trash2 size={16} aria-hidden="true" /></button>
    <Modal isOpen={open} onClose={() => { if (!locked.current) setOpen(false); }} closeDisabled={busy} title={tr('Xóa bài đăng')} className="!max-w-lg">
      <p className="mb-3 break-words text-left font-semibold">{title}</p>
      <p className="text-left text-sm text-slate-600">{tr('Bài đăng và lịch sử xét duyệt sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.')}</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{tr(error)}</p>}
      <div className="modal-footer"><button type="button" disabled={busy} onClick={() => setOpen(false)} className="action-secondary-detail">{tr('Hủy bỏ')}</button><button type="button" disabled={busy} onClick={() => void apply()} className="action-primary-detail">{busy ? tr('Đang xử lý…') : tr('Xóa vĩnh viễn')}</button></div>
    </Modal>
  </>;
}
