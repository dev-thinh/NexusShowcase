'use client';

import type { DraftRecovery } from './draft-recovery';

export function DraftRecoveryPanel({ records, serverVersion, onRestore, onDiscard }: {
  records: DraftRecovery[]; serverVersion: number; onRestore?: (record: DraftRecovery) => void; onDiscard?: (record: DraftRecovery) => void;
}) {
  if (!records.length) return null;
  return <section aria-label="Khôi phục bản nháp" className="space-y-4 border-b border-amber-300 bg-amber-50 p-4 text-sm text-slate-900 sm:px-8">
    <h2 className="font-semibold">Có nội dung chưa đồng bộ trên thiết bị này</h2>
    <p>Khôi phục để viết tiếp, hoặc tải bản sao trước khi xử lý thay đổi trên máy chủ.</p>
    {records.map(record => {
      const canRestore = record.expectedReviewVersion === serverVersion || Boolean(record.pendingMutation);
      return <article key={record.sessionId} className="space-y-3 rounded border border-amber-200 bg-white p-3">
        <p className="font-semibold">{record.data.title || 'Công trình chưa có tiêu đề'}</p>
        <p className="whitespace-pre-wrap break-words">{record.data.summary || 'Chưa có tóm tắt.'}</p>
        <p>Cập nhật trên thiết bị: {new Date(record.updatedAt).toLocaleString('vi-VN')}</p>
        {!canRestore && <p>Bản trên máy chủ đã thay đổi. Hãy giữ bản sao nội dung này để đối chiếu trước khi viết tiếp.</p>}
        <details><summary className="cursor-pointer py-2 font-semibold">Xem và sao chép toàn bộ nội dung</summary><textarea aria-label="Nội dung bản khôi phục" readOnly value={JSON.stringify(record.data, null, 2)} rows={8} className="mt-2 w-full rounded border border-slate-300 p-2 font-mono text-xs" /></details>
        <div className="flex flex-wrap gap-2">
          {onRestore && canRestore && <button type="button" className="action-primary-detail" onClick={() => onRestore(record)}>Khôi phục</button>}
          <button type="button" className="action-secondary-detail" onClick={() => {
            const url = URL.createObjectURL(new Blob([JSON.stringify(record.data, null, 2)], { type: 'application/json' }));
            const link = document.createElement('a'); link.href = url; link.download = `ban-nhap-${record.itemId}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}>Tải bản sao</button>
          {onDiscard && <button type="button" className="action-secondary-detail" onClick={() => onDiscard(record)}>Bỏ bản khôi phục</button>}
        </div>
      </article>;
    })}
  </section>;
}
