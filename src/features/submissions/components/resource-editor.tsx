'use client';

import { uploadFileAction } from '@/features/assets/server/actions';
import type { SubmissionResource } from '@/features/submissions/model/snapshot';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FilePicker } from '@/shared/ui/file-picker';
import { notifySuccess } from '@/shared/dialogs/success';

export function ResourceEditor({ value, onChange, onBusy }: { value: SubmissionResource[]; onChange: (value: SubmissionResource[]) => void; onBusy?: (busy: boolean) => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false);
  const add = (kind: SubmissionResource['kind']) => {
    onChange([...value, { kind, label: '', url: '', ...(kind === 'LINK' ? { linkType: 'OTHER' as const } : {}) }]);
    setIsResourceMenuOpen(false);
  };
  const update = (index: number, patch: Partial<SubmissionResource>) => onChange(value.map((entry, current) => current === index ? { ...entry, ...patch } : entry));
  const upload = async (index: number, file?: File) => {
    if (!file || uploading) return;
    setUploading(true);
    onBusy?.(true);
    setMessage('Đang tải lên…');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('type', 'resource');
      const result = await uploadFileAction(data);
      if (!result.success) { setMessage(result.error ?? 'Tải lên thất bại.'); return; }
      const label = value[index].label.trim() || result.data.fileName || file.name;
      update(index, { url: result.data.url, label, fileName: label, fileSize: result.data.fileSize, mimeType: result.data.mimeType });
      setMessage('');
      await notifySuccess('Đã tải tệp lên. Lưu bản nháp để giữ thay đổi.');
    } catch {
      setMessage('Không tải được tệp. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      onBusy?.(false);
    }
  };

  return (
    <div className="mt-5" aria-busy={uploading}>
      <div className="relative" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsResourceMenuOpen(false);
      }} onKeyDown={event => {
        if (event.key === 'Escape') { setIsResourceMenuOpen(false); event.currentTarget.querySelector('button')?.focus(); }
      }}>
        <button type="button" aria-expanded={isResourceMenuOpen} aria-controls="add-resource-options" onClick={() => setIsResourceMenuOpen(open => !open)} className="action-secondary-detail min-h-11 w-full">
          Thêm tài nguyên
        </button>
        {isResourceMenuOpen && <div id="add-resource-options" className="absolute z-30 mt-2 w-full rounded-md border border-slate-200 bg-white p-1.5 shadow-lg shadow-[#153D67]">
          <button type="button" onClick={() => add('DOCUMENT')} className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm text-[#1F2937] hover:bg-[#FFFFFF]">Tệp</button>
          <button type="button" onClick={() => add('LINK')} className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm text-[#1F2937] hover:bg-[#FFFFFF]">Liên kết</button>
        </div>}
      </div>
      <p className="mt-2 text-sm text-[#1F2937]" aria-live="polite">{message}</p>
      <div className="space-y-3">
        {value.map((resource, index) => (
          <div key={`${resource.kind}-${index}`} className="panel-nested grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 !p-3 shadow-none">
            <span className="col-span-2 text-sm font-semibold text-[#1F2937]">{resource.kind === 'LINK' ? 'Liên kết' : 'Tệp'}</span>
            <div className="grid min-w-0 gap-2">
              <input value={resource.label} onChange={(event) => update(index, { label: event.target.value, ...(resource.kind !== 'LINK' ? { fileName: event.target.value } : {}) })} maxLength={160} aria-label={`Tên tài nguyên ${index + 1}`} placeholder="Tên hiển thị" className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm" />
              {resource.kind === 'LINK' ? <input type="url" value={resource.url} onChange={(event) => update(index, { url: event.target.value })} aria-label={`URL tài nguyên ${index + 1}`} placeholder="https://" className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm" /> : <FilePicker busy={uploading} label={resource.url ? 'Đổi tệp' : 'Chọn tệp'} onChange={(event) => void upload(index, event.target.files?.[0])} aria-label={`Chọn tệp cho tài nguyên ${index + 1}`} />}
              {resource.kind !== 'LINK' && resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm text-[#1F2937] hover:underline">{resource.label || resource.fileName || 'Xem tệp đã tải lên'}</a>}
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} aria-label={`Xóa tài nguyên ${index + 1}`} title="Xóa tài nguyên" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[#1F2937] transition-colors hover:bg-[#FFFFFF] hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
