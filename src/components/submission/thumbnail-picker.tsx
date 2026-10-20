'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { uploadFileAction } from '@/actions/upload-actions';

export interface ThumbnailOption { id: string; url: string; alt: string; caption: string }

export function ThumbnailPicker({ value, images = [], errors = [], onChange, onBusy = () => undefined }: {
  value?: string | null;
  images?: ThumbnailOption[];
  errors?: string[];
  onChange: (url: string | null) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
      const result = await uploadFileAction(data);
      if (!result.success || !result.url) { setError(result.error || 'Không tải được ảnh.'); return; }
      onChange(result.url);
    } catch { setError('Tải ảnh thất bại. Vui lòng thử lại.'); }
    finally {
      setUploading(false);
      onBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  const message = error || errors[0];
  return <div className="space-y-2">
    <label htmlFor="submission-thumbnail" className="block text-sm font-semibold text-slate-900">Ảnh đại diện</label>
    <div className="flex flex-wrap items-center gap-3">
      {value && <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Ảnh đại diện đã chọn" className="h-20 w-32 rounded-md border border-slate-200 object-cover" />
        <button type="button" disabled={uploading} onClick={() => { setError(''); onChange(null); }} aria-label="Bỏ ảnh đại diện" className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"><X aria-hidden="true" className="h-4 w-4" /></button>
      </div>}
      <div className="space-y-1.5">
        <input ref={inputRef} id="submission-thumbnail" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => void upload(event.target.files?.[0])} aria-invalid={!!message} aria-describedby={message ? 'submission-thumbnail-error' : 'submission-thumbnail-hint'} className="sr-only" />
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="action-secondary-detail min-h-10 text-xs"><ImagePlus aria-hidden="true" className="h-4 w-4" />{uploading ? 'Đang tải ảnh…' : value ? 'Đổi ảnh' : 'Chọn ảnh'}</button>
        <p id="submission-thumbnail-hint" className="text-xs text-slate-500">JPG, PNG, WebP · Tối đa 5 MB</p>
      </div>
    </div>
    {images.length > 0 && <details>
      <summary className="w-fit cursor-pointer py-1 text-xs text-slate-600 hover:text-[#0F294A]">Chọn ảnh trong bài</summary>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Ảnh trong bài">
        {images.map((image, index) => <button key={image.id} type="button" disabled={uploading} aria-pressed={value === image.url} aria-label={`Chọn ảnh ${index + 1}: ${image.caption || image.alt || 'Ảnh trong bài'}`} onClick={() => { setError(''); onChange(image.url); }} className={`overflow-hidden rounded-md border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] focus-visible:ring-offset-2 ${value === image.url ? 'border-[#0F294A]' : 'border-transparent hover:border-slate-300'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt || image.caption} className="h-14 w-20 object-cover" />
        </button>)}
      </div>
    </details>}
    {message && <p id="submission-thumbnail-error" role="alert" className="text-sm text-rose-700">{message}</p>}
  </div>;
}
