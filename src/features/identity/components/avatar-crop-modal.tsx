'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Minus, Plus, RotateCcw } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { useI18n } from '@/shared/i18n/provider';
import { avatarCrop } from '../model/avatar-crop';

export function AvatarCropModal({ file, onCancel, onSave }: { file: File; onCancel: () => void; onSave: (file: File) => Promise<void> }) {
  const { t: tr } = useI18n();
  const id = useId();
  const [url, setUrl] = useState('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const crop = dimensions ? avatarCrop(dimensions.width, dimensions.height, zoom, position) : null;
  useEffect(() => {
    const source = URL.createObjectURL(file);
    setUrl(source);
    return () => URL.revokeObjectURL(source);
  }, [file]);

  function move(x: number, y: number) {
    if (!dimensions || busy) return;
    const next = avatarCrop(dimensions.width, dimensions.height, zoom, { x, y });
    setPosition({ x: next.offsetX, y: next.offsetY });
  }
  function changeZoom(value: number) {
    if (busy || !dimensions || !crop) return;
    const nextZoom = Math.min(4, Math.max(1, value));
    // Preserve the selected source center while changing the crop size.
    const next = avatarCrop(dimensions.width, dimensions.height, nextZoom, { x: crop.offsetX * nextZoom / zoom, y: crop.offsetY * nextZoom / zoom });
    setPosition({ x: next.offsetX, y: next.offsetY });
    setZoom(nextZoom);
  }
  async function save() {
    if (!crop || !image.current || busy) return;
    setBusy(true); setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Không xử lý được ảnh. Vui lòng thử lại.');
      context.fillStyle = '#fff'; context.fillRect(0, 0, 1024, 1024);
      context.imageSmoothingQuality = 'high';
      context.drawImage(image.current, crop.sourceX, crop.sourceY, crop.size, crop.size, 0, 0, 1024, 1024);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Không xử lý được ảnh. Vui lòng thử lại.')), 'image/jpeg', 0.92));
      await onSave(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không đổi được ảnh. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }

  return <Modal isOpen onClose={onCancel} closeDisabled={busy} title={tr('Căn chỉnh ảnh đại diện')} className="!max-w-lg !rounded-2xl">
    <div className="space-y-4">
      <p id={`${id}-hint`} className="text-sm text-slate-600">{tr('Kéo ảnh để căn chỉnh hoặc dùng phím mũi tên. Vùng tròn là phần avatar sẽ hiển thị.')}</p>
      <div className="avatar-crop-stage" role="group" aria-label={tr('Vùng căn chỉnh ảnh đại diện')} aria-describedby={`${id}-hint`} aria-busy={busy} tabIndex={0}
        onPointerDown={event => {
          if (!crop || busy || event.button !== 0 || drag.current) return;
          event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: crop.offsetX, originY: crop.offsetY };
        }}
        onPointerMove={event => {
          const current = drag.current;
          if (!current || event.pointerId !== current.id) return;
          const size = event.currentTarget.getBoundingClientRect().width;
          if (size) move(current.originX + (event.clientX - current.x) / size, current.originY + (event.clientY - current.y) / size);
        }}
        onPointerUp={event => { if (drag.current?.id === event.pointerId) drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
        onKeyDown={event => {
          const step = event.shiftKey ? 0.08 : 0.02;
          const shifts: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
          if (!crop || busy || !shifts[event.key]) return;
          event.preventDefault(); const [x, y] = shifts[event.key]; move(crop.offsetX + x, crop.offsetY + y);
        }}>
        {url && <img ref={image} src={url} alt={tr('Ảnh đại diện đang căn chỉnh')} draggable={false}
          onLoad={event => { const img = event.currentTarget; setDimensions({ width: img.naturalWidth, height: img.naturalHeight }); }}
          onError={() => setError('Không đọc được ảnh. Vui lòng chọn ảnh khác.')}
          style={crop && dimensions ? { width: `${dimensions.width / crop.size * 100}%`, height: `${dimensions.height / crop.size * 100}%`, left: `${50 + crop.offsetX * 100}%`, top: `${50 + crop.offsetY * 100}%` } : { opacity: 0 }} />}
        {!crop && !error && <Loader2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-600" aria-label={tr('Đang tải ảnh')} />}
        <div className="avatar-crop-circle" aria-hidden="true" />
        <div className="avatar-crop-grid" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="action-secondary-detail !h-11 !w-11 !p-0" aria-label={tr('Thu nhỏ ảnh')} disabled={busy || !crop || zoom <= 1} onClick={() => changeZoom(zoom - 0.1)}><Minus size={18} aria-hidden="true" /></button>
        <label htmlFor={`${id}-zoom`} className="sr-only">{tr('Độ phóng đại')}</label>
        <input id={`${id}-zoom`} type="range" min="1" max="4" step="0.01" value={zoom} aria-valuetext={`${Math.round(zoom * 100)}%`} disabled={busy || !crop} onChange={event => changeZoom(Number(event.target.value))} className="min-h-11 min-w-0 flex-1 accent-[#153D67]" />
        <button type="button" className="action-secondary-detail !h-11 !w-11 !p-0" aria-label={tr('Phóng to ảnh')} disabled={busy || !crop || zoom >= 4} onClick={() => changeZoom(zoom + 0.1)}><Plus size={18} aria-hidden="true" /></button>
        <output htmlFor={`${id}-zoom`} className="w-12 text-right text-sm tabular-nums">{Math.round(zoom * 100)}%</output>
      </div>
      {error && <p role="alert" className="text-sm text-rose-800">{tr(error)}</p>}
      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
        <button type="button" className="action-secondary-detail" disabled={busy || !crop} onClick={() => { setPosition({ x: 0, y: 0 }); setZoom(1); }}><RotateCcw size={16} aria-hidden="true" />{tr('Đặt lại')}</button>
        <div className="flex gap-2">
          <button type="button" className="action-secondary-detail" disabled={busy} onClick={onCancel}>{tr('Hủy')}</button>
          <button type="button" className="action-primary-detail" disabled={busy || !crop} onClick={() => void save()}>{busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{busy ? tr('Đang lưu...') : tr('Lưu ảnh đại diện')}</button>
        </div>
      </div>
    </div>
  </Modal>;
}
