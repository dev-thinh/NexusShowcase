'use client';
import { useI18n } from '@/shared/i18n/provider';


import { deleteShowcaseDraftAction } from '@/features/submissions/server/actions';
import { useDialog } from '@/shared/dialogs/dialog-provider';
import { notifySuccess } from '@/shared/dialogs/success';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function DeleteDraftButton({ itemId, reviewVersion, title }: { itemId: string; reviewVersion: number; title: string }) {
  const { t: tr } = useI18n();

  const dialog = useDialog();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return <div>
    <button type="button" disabled={pending} className="action-secondary-card min-h-10 text-red-700 disabled:opacity-50" onClick={async () => {
      if (!await dialog.confirm({ title: tr('Xóa bản nháp?'), message: tr('Bạn có chắc muốn xóa “{0}”? Thao tác này không thể hoàn tác.', title || tr('Công trình chưa có tiêu đề')), confirmLabel: tr('Xóa bản nháp'), destructive: true })) return;
      setError('');
      startTransition(async () => {
        try {
          const result = await deleteShowcaseDraftAction(itemId, reviewVersion);
          if (!result.success) { setError(result.error); return; }
          await notifySuccess('Đã xóa bản nháp.');
          router.refresh();
        } catch {
          setError('Không kết nối được. Vui lòng thử lại.');
        }
      });
    }}><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />{pending ? tr("Đang xóa…") : tr("Xóa bản nháp")}</button>
    {error && <p role="alert" className="mt-1 text-xs text-red-700">{tr(error)}</p>}
  </div>;
}
