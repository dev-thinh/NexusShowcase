'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { uploadFileAction } from '@/actions/upload-actions';
import type { SubmissionResource } from '@/lib/submission-types';

export function ResourceEditor({ value, onChange }: { value: SubmissionResource[]; onChange: (value: SubmissionResource[]) => void }) {
  const [message, setMessage] = useState('');
  const add = (kind: SubmissionResource['kind']) => onChange([...value, { kind, label: '', url: '' }]);
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
      <label htmlFor="add-resource" className="sr-only">Thêm tài nguyên</label>
      <select id="add-resource" defaultValue="" onChange={(event) => { if (event.target.value) add(event.target.value as SubmissionResource['kind']); event.target.value = ''; }} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800">
        <option value="">Thêm tài nguyên</option><option value="IMAGE">Hình ảnh</option><option value="DOCUMENT">Tài liệu PDF</option><option value="LINK">Liên kết</option>
      </select>
      <p className="mt-2 text-sm text-slate-600" aria-live="polite">{message}</p>
      <div>
        {value.map((resource, index) => (
          <div key={`${resource.kind}-${index}`} className="grid gap-3 border-t border-slate-200 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_2.75rem] sm:items-center">
            <span className="text-sm font-semibold text-slate-700">{resource.kind === 'IMAGE' ? 'Hình ảnh' : resource.kind === 'DOCUMENT' ? 'Tài liệu PDF' : 'Liên kết'}</span>
            <div className="grid gap-2">
              <input value={resource.label} onChange={(event) => update(index, { label: event.target.value })} aria-label={`Tên tài nguyên ${index + 1}`} placeholder="Tên hiển thị" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" />
              {resource.kind === 'LINK' ? <input type="url" value={resource.url} onChange={(event) => update(index, { url: event.target.value })} aria-label={`URL tài nguyên ${index + 1}`} placeholder="https://" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" /> : <input type="file" accept={resource.kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={(event) => void upload(index, event.target.files?.[0])} aria-label={`Chọn tệp cho tài nguyên ${index + 1}`} className="block min-h-11 w-full text-sm text-slate-700 file:mr-3 file:min-h-11 file:border-0 file:bg-slate-100 file:px-3 file:font-semibold" />}
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} aria-label={`Xóa tài nguyên ${index + 1}`} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-rose-700"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
