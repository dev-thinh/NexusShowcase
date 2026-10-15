'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { uploadFileAction } from '@/actions/upload-actions';
import type { SubmissionResource } from '@/lib/submission-types';

export function ResourceEditor({ value, onChange }: { value: SubmissionResource[]; onChange: (value: SubmissionResource[]) => void }) {
  const [message, setMessage] = useState('');
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false);
  const add = (kind: SubmissionResource['kind']) => {
    onChange([...value, { kind, label: '', url: '' }]);
    setIsResourceMenuOpen(false);
  };
  const update = (index: number, patch: Partial<SubmissionResource>) => onChange(value.map((entry, current) => current === index ? { ...entry, ...patch } : entry));
  const upload = async (index: number, file?: File) => {
    if (!file) return;
    setMessage('Đang tải lên…');
    const data = new FormData();
    data.append('file', file);
    data.append('type', value[index].kind === 'IMAGE' ? 'thumbnail' : 'pdf');
    const result = await uploadFileAction(data);
    if (!result.success || !result.url) return setMessage(result.error ?? 'Tải lên thất bại.');
    update(index, { url: result.url, label: result.fileName ?? file.name, fileName: result.fileName, fileSize: result.fileSize, mimeType: result.mimeType });
    setMessage('Đã tải lên.');
  };

  return (
    <div className="mt-5">
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsResourceMenuOpen(false);
        }}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isResourceMenuOpen}
          aria-controls="add-resource-menu"
          onClick={() => setIsResourceMenuOpen((current) => !current)}
          className="action-secondary-detail min-h-11 w-full"
        >
          Thêm tài nguyên
        </button>
        {isResourceMenuOpen && (
          <div id="add-resource-menu" role="menu" className="absolute z-30 mt-2 w-full rounded-md border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10">
            <button type="button" role="menuitem" onClick={() => add('IMAGE')} className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:outline-none">Hình ảnh</button>
            <button type="button" role="menuitem" onClick={() => add('DOCUMENT')} className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:outline-none">Tài liệu PDF</button>
            <button type="button" role="menuitem" onClick={() => add('LINK')} className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:outline-none">Liên kết</button>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600" aria-live="polite">{message}</p>
      <div className="space-y-3">
        {value.map((resource, index) => (
          <div key={`${resource.kind}-${index}`} className="panel-nested grid gap-3 !p-3 shadow-none xl:grid-cols-[7rem_minmax(0,1fr)_2.75rem] xl:items-start">
            <span className="text-sm font-semibold text-slate-700">{resource.kind === 'IMAGE' ? 'Hình ảnh' : resource.kind === 'DOCUMENT' ? 'Tài liệu PDF' : 'Liên kết'}</span>
            <div className="grid gap-2">
              <input value={resource.label} onChange={(event) => update(index, { label: event.target.value })} aria-label={`Tên tài nguyên ${index + 1}`} placeholder="Tên hiển thị" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" />
              {resource.kind === 'LINK' ? <input type="url" value={resource.url} onChange={(event) => update(index, { url: event.target.value })} aria-label={`URL tài nguyên ${index + 1}`} placeholder="https://" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" /> : <input type="file" accept={resource.kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={(event) => void upload(index, event.target.files?.[0])} aria-label={`Chọn tệp cho tài nguyên ${index + 1}`} className="block min-h-11 w-full text-sm text-slate-700 file:mr-3 file:min-h-11 file:border-0 file:bg-slate-100 file:px-3 file:font-semibold" />}
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} aria-label={`Xóa tài nguyên ${index + 1}`} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
