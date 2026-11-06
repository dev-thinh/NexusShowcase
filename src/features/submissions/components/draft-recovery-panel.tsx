'use client';
import { useI18n } from '@/shared/i18n/provider';


import type { DraftRecovery } from './draft-recovery';

export function DraftRecoveryPanel({ records, serverVersion, onRestore, onDiscard }: {
  records: DraftRecovery[]; serverVersion: number; onRestore?: (record: DraftRecovery) => void; onDiscard?: (record: DraftRecovery) => void;
}) {
  const { t: tr, locale } = useI18n();

  if (!records.length) return null;
  return <section aria-label={tr("Khôi phục bản nháp")} className="space-y-4 border-b border-amber-300 bg-amber-50 p-4 text-sm text-slate-900 sm:px-8">
    <h2 className="font-semibold">{tr("Nội dung chưa lưu")}</h2>
    <p>{tr("Bạn có thể giữ bản sao để đối chiếu với nội dung ở tab khác.")}</p>
    {records.map(record => {
      const canRestore = record.expectedReviewVersion === serverVersion || Boolean(record.pendingMutation);
      return <article key={record.sessionId} className="space-y-3 rounded border border-amber-200 bg-white p-3">
        <p className="font-semibold">{record.data.title || tr("Công trình chưa có tiêu đề")}</p>
        <p className="whitespace-pre-wrap break-words">{record.data.summary || tr("Chưa có tóm tắt.")}</p>
        <p>{tr("Lần viết gần nhất: ")}{new Date(record.updatedAt).toLocaleString(locale === 'en' ? 'en-GB' : 'vi-VN')}</p>
        {!canRestore && <p>{tr("Bản trên máy chủ đã thay đổi. Hãy giữ bản sao nội dung này để đối chiếu trước khi viết tiếp.")}</p>}
        <details><summary className="cursor-pointer py-2 font-semibold">{tr("Xem và sao chép toàn bộ nội dung")}</summary><textarea aria-label={tr("Nội dung bản khôi phục")} readOnly value={JSON.stringify(record.data, null, 2)} rows={8} className="mt-2 w-full rounded border border-slate-300 p-2 font-mono text-xs" /></details>
        <div className="flex flex-wrap gap-2">
          {onRestore && canRestore && <button type="button" className="action-primary-detail" onClick={() => onRestore(record)}>{tr("Khôi phục")}</button>}
          <button type="button" className="action-secondary-detail" onClick={() => {
            const url = URL.createObjectURL(new Blob([JSON.stringify(record.data, null, 2)], { type: 'application/json' }));
            const link = document.createElement('a'); link.href = url; link.download = `ban-nhap-${record.itemId}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}>{tr("Tải bản sao")}</button>
          {onDiscard && <button type="button" className="action-secondary-detail" onClick={() => onDiscard(record)}>{tr("Bỏ bản khôi phục")}</button>}
        </div>
      </article>;
    })}
  </section>;
}
