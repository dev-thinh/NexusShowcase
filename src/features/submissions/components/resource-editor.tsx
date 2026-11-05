'use client';

import { SubmissionField } from './submission-field';
import { uploadFile } from '@/shared/lib/upload-file';
import type { UploadedAsset } from '@/features/assets/model/contracts';
import type { SubmissionResource } from '@/features/submissions/model/snapshot';
import { Github, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { FilePicker } from '@/shared/ui/file-picker';

export function ResourceEditor({ value, onChange, onBusy, errors = {} }: { errors?: Record<string, string[]>; value: SubmissionResource[]; onChange: (value: SubmissionResource[]) => void; onBusy?: (busy: boolean) => void }) {
  const githubEnabled = value.some(resource => resource.linkType === 'GITHUB');
  const savedGithub = useRef<SubmissionResource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const toggleGithub = (enabled: boolean) => {
    if (enabled) {
      onChange([...value, ...(savedGithub.current.length ? savedGithub.current : [{ kind: 'LINK' as const, label: 'Mã nguồn GitHub', url: '', linkType: 'GITHUB' as const }])]);
    } else {
      savedGithub.current = value.filter(resource => resource.linkType === 'GITHUB');
      onChange(value.filter(resource => resource.linkType !== 'GITHUB'));
    }
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
      const result = await uploadFile<UploadedAsset>(data);
      if (!result.success) { setMessage(result.error ?? 'Tải lên thất bại.'); return; }
      const label = value[index].label.trim() || result.data.fileName || file.name;
      update(index, { url: result.data.url, label, fileName: label, fileSize: result.data.fileSize, mimeType: result.data.mimeType });
      setMessage('');
    } catch {
      setMessage('Không tải được tệp. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      onBusy?.(false);
    }
  };

  return (
    <div className="mt-5" aria-busy={uploading}>
      <div className="grid gap-3">
        <label className="flex cursor-pointer items-center gap-4">
          <span className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F2937]">
            <Github aria-hidden="true" className="h-5 w-5" /><span>GitHub</span>
          </span>
          <input type="checkbox" checked={githubEnabled} onChange={event => toggleGithub(event.target.checked)} aria-controls="github-resource-fields" className="h-6 w-6 shrink-0 cursor-pointer accent-[#153D67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30 focus-visible:ring-offset-2" />
        </label>
      </div>
      <p role={message && !uploading ? 'alert' : 'status'} className="mt-2 text-sm" aria-live={uploading ? 'polite' : undefined}>{message}</p>
      <div id="github-resource-fields" className="space-y-3">{errors.resources?.length ? <SubmissionField name="resources" errors={errors}><span /></SubmissionField> : null}
        {value.map((resource, index) => (
          <SubmissionField name={`resources.${index}`} errors={errors} key={`${resource.kind}-${index}`}><div className="panel-nested grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 !p-3 shadow-none">
            <span className="col-span-2 text-sm font-semibold text-[#1F2937]">{resource.linkType === 'GITHUB' ? 'Mã nguồn GitHub' : resource.kind === 'LINK' ? 'Liên kết' : 'Tệp'}</span>
            <div className="grid min-w-0 gap-2">
              {resource.linkType !== 'GITHUB' && <SubmissionField name={`resources.${index}.label`} errors={errors}><input value={resource.label} onChange={(event) => update(index, { label: event.target.value, ...(resource.kind !== 'LINK' ? { fileName: event.target.value } : {}) })} maxLength={160} aria-label={`Tên tài nguyên ${index + 1}`} placeholder="Tên hiển thị" className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm" /></SubmissionField>}
              <SubmissionField name={`resources.${index}.url`} errors={errors}>{resource.kind === 'LINK' ? <input type="url" value={resource.url} onChange={(event) => update(index, { url: event.target.value })} aria-label={`URL tài nguyên ${index + 1}`} placeholder={resource.linkType === 'GITHUB' ? 'https://github.com/owner/repository' : 'https://'} className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm" /> : <FilePicker busy={uploading} label={resource.url ? 'Đổi tệp' : 'Chọn tệp'} onChange={(event) => void upload(index, event.target.files?.[0])} aria-label={`Chọn tệp cho tài nguyên ${index + 1}`} />}</SubmissionField>
              {resource.kind !== 'LINK' && resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm text-[#1F2937] hover:underline">{resource.label || resource.fileName || 'Xem tệp đã tải lên'}</a>}
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} aria-label={`Xóa tài nguyên ${index + 1}`} title="Xóa tài nguyên" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[#1F2937] transition-colors hover:bg-[#FFFFFF] hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
          </div></SubmissionField>
        ))}
      </div>
    </div>
  );
}
