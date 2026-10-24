'use client';
import { withdrawSubmissionAction } from '@/features/submissions/server/actions';
import { useDialog } from '@/shared/dialogs/dialog-provider';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
export function WithdrawSubmissionButton({ itemId, reviewVersion }: { itemId: string; reviewVersion: number }) {
  const router = useRouter();
  const dialog = useDialog();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  return <div><button type="button" disabled={pending} className="action-secondary-detail min-h-10 text-xs disabled:opacity-50" onClick={async () => {
    if (!await dialog.confirm({ title: 'Rút bài để sửa?', message: 'Bài sẽ được rút khỏi danh sách chờ duyệt và trở về bản nháp.', confirmLabel: 'Rút bài' })) return;
    startTransition(async () => {
      try { const result = await withdrawSubmissionAction(itemId, reviewVersion); if (!result.success) { setError(result.error || 'Không rút được bài.'); return; } router.push(`/dashboard/items/${itemId}/edit`); }
      catch { setError('Không kết nối được. Vui lòng thử lại.'); }
    });
  }}>{pending ? 'Đang rút…' : 'Rút bài để sửa'}</button>{error && <p role="alert" className="mt-1 text-xs text-[#1F2937]">{error}</p>}</div>;
}
