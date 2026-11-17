'use client';
import { useI18n } from '@/shared/i18n/provider';


import { SubmissionField } from './submission-field';
import { uploadFile } from '@/shared/lib/upload-file';
import type { UploadedAsset } from '@/features/assets/model/contracts';
import type { SubmissionResource } from '@/features/submissions/model/snapshot';
import { Github, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FilePicker } from '@/shared/ui/file-picker';

export function ResourceEditor({ value, onChange, onBusy, errors = {} }: { errors?: Record<string, string[]>; value: SubmissionResource[]; onChange: (value: SubmissionResource[]) => void; onBusy?: (busy: boolean) => void }) {
  const { t: tr } = useI18n();

  const githubIndex = value.findIndex(resource => resource.linkType === 'GITHUB');
  const githubUrl = githubIndex >= 0 ? value[githubIndex].url : '';
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const setGithubUrl = (nextUrl: string) => {
    if (!nextUrl.trim()) {
      onChange(value.filter(resource => resource.linkType !== 'GITHUB'));
      return;
    }
    if (githubIndex >= 0) {
      onChange(value.map((entry, current) => current === githubIndex ? { ...entry, url: nextUrl } : entry));
    } else {
      onChange([...value, { kind: 'LINK' as const, label: tr('Mã nguồn GitHub'), url: nextUrl, linkType: 'GITHUB' as const }]);
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

  const githubFieldName = githubIndex >= 0 ? `resources.${githubIndex}.url` : 'resources.0.url';

  return (
    <div className="mt-4" aria-busy={uploading}>
      <div id="github-resource-fields" className="space-y-3">
        {errors.resources?.length ? <SubmissionField name="resources" errors={errors}><span /></SubmissionField> : null}
        <SubmissionField name={githubFieldName} errors={errors}>
          <label htmlFor="submission-github-url" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
            <Github aria-hidden="true" className="h-4 w-4 shrink-0" /><span>GitHub</span>
          </label>
          <input
            id="submission-github-url"
            type="url"
            value={githubUrl}
            onChange={event => setGithubUrl(event.target.value)}
            aria-label={tr("Mã nguồn GitHub")}
            placeholder="https://github.com/owner/repository"
            className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-slate-200 focus:ring-2 focus:ring-[#153D67]/15"
          />
        </SubmissionField>
        {message && <p role={!uploading ? 'alert' : 'status'} className="mt-2 text-sm" aria-live={uploading ? 'polite' : undefined}>{tr(message)}</p>}
        {value.map((resource, index) => resource.linkType === 'GITHUB' ? null : (
          <SubmissionField name={`resources.${index}`} errors={errors} key={`${resource.kind}-${index}`}><div className="panel-nested grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 !p-3 shadow-none">
            <span className="col-span-2 text-sm font-semibold text-[#1F2937]">{resource.kind === 'LINK' ? tr("Liên kết") : tr("Tệp")}</span>
            <div className="grid min-w-0 gap-2">
              <SubmissionField name={`resources.${index}.label`} errors={errors}><input value={resource.label} onChange={(event) => update(index, { label: event.target.value, ...(resource.kind !== 'LINK' ? { fileName: event.target.value } : {}) })} maxLength={160} aria-label={tr("Tên tài nguyên {0}", index + 1)} placeholder={tr("Tên hiển thị")} className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm" /></SubmissionField>
              <SubmissionField name={`resources.${index}.url`} errors={errors}>{resource.kind === 'LINK' ? <input type="url" value={resource.url} onChange={(event) => update(index, { url: event.target.value })} aria-label={tr("URL tài nguyên {0}", index + 1)} placeholder="https://" className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm" /> : <FilePicker busy={uploading} label={resource.url ? tr("Đổi tệp") : tr("Chọn tệp")} onChange={(event) => void upload(index, event.target.files?.[0])} aria-label={tr("Chọn tệp cho tài nguyên {0}", index + 1)} />}</SubmissionField>
              {resource.kind !== 'LINK' && resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm text-[#1F2937] hover:underline">{resource.label || resource.fileName || tr("Xem tệp đã tải lên")}</a>}
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} aria-label={tr("Xóa tài nguyên {0}", index + 1)} title={tr("Xóa tài nguyên")} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[#1F2937] transition-colors hover:bg-[#FFFFFF] hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
          </div></SubmissionField>
        ))}
      </div>
    </div>
  );
}
