'use client';
import { useI18n } from '@/shared/i18n/provider';


import { MediaImage } from '@/shared/ui/media-image';
import { FilePicker } from '@/shared/ui/file-picker';

import { uploadFile } from '@/shared/lib/upload-file';
import type { UploadedAsset } from '@/features/assets/model/contracts';
import { X } from 'lucide-react';
import { useState } from 'react';

export interface ThumbnailOption { id: string; url: string; alt: string; caption: string }

export function ThumbnailPicker({ value, images = [], errors = [], onChange, onBusy = () => undefined }: {
  value?: string | null;
  images?: ThumbnailOption[];
  errors?: string[];
  onChange: (url: string | null) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const { t: tr } = useI18n();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file?: File) => {
    if (!file || uploading) return;
    setError('');
    setUploading(true);
    onBusy(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('type', 'thumbnail');
      const result = await uploadFile<UploadedAsset>(data);
      if (!result.success) { setError(result.error || 'Không tải được ảnh.'); return; }
      onChange(result.data.url);
    } catch { setError('Tải ảnh thất bại. Vui lòng thử lại.'); }
    finally {
      setUploading(false);
      onBusy(false);
    }
  };
  const message = error || errors[0];
  return <div className="space-y-2">
    <label htmlFor="submission-thumbnail" className="block text-sm font-semibold text-[#1F2937]">{tr("Ảnh đại diện")}</label>
    <div className="flex flex-wrap items-center gap-3">
      {<div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <MediaImage width={128} height={96} sizes="128px" src={value} alt={tr("Ảnh đại diện đã chọn")} className="aspect-[4/3] w-32 rounded-md border border-slate-200 bg-slate-50 object-cover" />
        {value && <button type="button" disabled={uploading} onClick={() => { setError(''); onChange(null); }} aria-label={tr("Bỏ ảnh đại diện")} className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1F2937] shadow-sm hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]"><X aria-hidden="true" className="h-4 w-4" /></button>}
      </div>}
      <div className="space-y-1.5">
        <FilePicker id="submission-thumbnail" label={value ? tr("Đổi ảnh") : tr("Chọn ảnh")} accept="image/jpeg,image/png,image/webp" busy={uploading} onChange={event => void upload(event.target.files?.[0])} aria-invalid={!!message} aria-describedby={message ? 'submission-thumbnail-error' : 'submission-thumbnail-hint'} />
        <p id="submission-thumbnail-hint" className="text-xs text-[#1F2937]">{tr("JPG, PNG, WebP · Tối đa 5 MB · Nên dùng ảnh 4:3 (1200 × 900 px)")}</p>
      </div>
    </div>
    {images.length > 0 && <details>
      <summary className="w-fit cursor-pointer py-1 text-xs text-[#1F2937] hover:text-[#1F2937]">{tr("Chọn ảnh trong bài")}</summary>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={tr("Ảnh trong bài")}>
        {images.map((image, index) => <button key={image.id} type="button" disabled={uploading} aria-pressed={value === image.url} aria-label={tr("Chọn ảnh {0}: {1}", index + 1, image.caption || image.alt || tr('Ảnh trong bài'))} onClick={() => { setError(''); onChange(image.url); }} className={`overflow-hidden rounded-md border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 ${value === image.url ? 'border-slate-200' : 'border-transparent hover:border-slate-200'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <MediaImage width={80} height={60} sizes="80px" src={image.url} alt={image.alt || image.caption} className="aspect-[4/3] w-20 rounded-md object-cover" />
        </button>)}
      </div>
    </details>}
    {message && <p id="submission-thumbnail-error" role="alert" className="text-sm text-red-700">{tr(message)}</p>}
  </div>;
}
