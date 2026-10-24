'use client';

import { MediaImage } from '@/shared/ui/media-image';

import { ArrowLeft, ArrowRight, Expand, Loader2, Pause, Pencil, Play } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/shared/ui/modal';
import { defaultMoments, momentRows, momentsSaveSchema, type MomentsPayload, type MomentsGallery } from '@/features/publications/model/moments';
import { MomentsEditor } from '@/features/publications/components/moments-editor';

export function HomeMoments({ initialGallery = { photos: defaultMoments, version: 0, isAdmin: false } }: { initialGallery?: MomentsPayload }) {
  const [gallery, setGallery] = useState<MomentsGallery>(initialGallery);
  const [protectedSources, setProtectedSources] = useState(initialGallery.protectedSources ?? []);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [opening, setOpening] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const rows = momentRows(gallery.photos);
  const photos = rows.flat();
  const hasMotion = rows.some(row => row.length >= 3);
  function finishEditing(saved?: MomentsGallery) {
    if (saved) { setGallery(saved); setNotice('Đã lưu thay đổi.'); }
    setEditing(false);
    setKeyboardBrowsing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }
  async function startEditing() {
    setOpening(true);
    setNotice('');
    try {
      const response = await fetch('/api/home/moments', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.isAdmin) throw new Error('Không mở được chỉnh sửa. Vui lòng kiểm tra phiên đăng nhập Admin và thử lại.');
      setGallery(momentsSaveSchema.parse(result));
      setProtectedSources(result.protectedSources ?? []);
      setSelected(null);
      setEditing(true);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Không tải được ảnh. Vui lòng thử lại.'); }
    finally { setOpening(false); }
  }
  const wallRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [keyboardBrowsing, setKeyboardBrowsing] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const current = selected === null ? null : photos[selected];

  // Restored focus after a modal closes is not a request to browse a strip.
  // Enter manual mode only for an actual Tab press outside the photo viewer.
  useEffect(() => {
    if (selected !== null || editing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') setKeyboardBrowsing(true);
    };
    const onPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.moment-photo')) setKeyboardBrowsing(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [selected, editing]);

  useEffect(() => {
    if (!keyboardBrowsing && window.matchMedia('(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
      wallRef.current?.querySelectorAll('.moments-lane').forEach(lane => { lane.scrollLeft = 0; });
    }
  }, [keyboardBrowsing, selected]);

  const closeViewer = () => {
    setKeyboardBrowsing(false);
    setSelected(null);
  };

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      setSelected(value => value === null ? null : (value + step + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <section ref={wallRef} className="moments-wall" aria-labelledby="moments-title" data-keyboard-browsing={keyboardBrowsing ? 'true' : undefined} data-paused={paused || selected !== null || editing ? 'true' : undefined}>
      <div className="moments-heading container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="moments-eyebrow">Nhịp sống sáng tạo <span aria-hidden="true">/</span> <span>Hoạt động CLB</span></p>
          <h2 id="moments-title" className="moments-title">Những khoảnh khắc<br />cùng nhau <em>tạo nên công nghệ.</em></h2>
        </div>
        <div className="moments-heading-actions">
          {initialGallery.isAdmin && !editing && <button ref={editButton} type="button" className="moments-edit-button" aria-label="Chỉnh sửa ảnh khoảnh khắc" title="Chỉnh sửa ảnh" disabled={opening} onClick={() => void startEditing()}>{opening ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Pencil size={18} aria-hidden="true" />}</button>}
        {!editing && hasMotion && <div className="moments-controls">
          <button type="button" className="moments-pause" aria-label={paused ? 'Tiếp tục chuyển động' : 'Tạm dừng chuyển động'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
            {paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
          </button>
        </div>}
        </div>
      </div>

      {notice && <p role="status" className="container mx-auto mt-4 max-w-7xl px-4 text-sm text-emerald-800 sm:px-6 lg:px-8">{notice}</p>}
      {editing && <MomentsEditor gallery={gallery} protectedSources={protectedSources} onSave={finishEditing} onCancel={() => finishEditing()} />}
      {photos.length === 0 ? <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><MediaImage alt="Khoảnh khắc CLB" className="h-64 w-full rounded-lg" /></div> : <div className="moments-strips">
        {rows.map((row, laneIndex) => row.length > 0 && (
          <div className={`moments-lane${row.length < 3 ? ' moments-lane--static' : ''}`} key={laneIndex} data-row={laneIndex} data-motion={row.length >= 3 ? 'true' : 'false'}>
            <div className={`moments-track${laneIndex === 1 ? ' moments-track--reverse' : ''}`}>
              {(row.length >= 3 ? [false, true] : [false]).map(copy => (
                <div className="moments-group" aria-hidden={copy || undefined} key={String(copy)}>
                  {row.map((photo, index) => {
                    const photoIndex = photos.findIndex(item => item.id === photo.id);
                    return (
                      <button type="button" className={`moment-photo moment-photo--${photo.shape}`} key={photo.src} style={{ '--photo-tilt': photo.tilt, '--photo-offset': index % 2 ? '0.75rem' : '-0.5rem' } as CSSProperties} tabIndex={copy ? -1 : undefined} aria-label={`Xem ảnh: ${photo.title}`} onClick={() => setSelected(photoIndex)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <MediaImage src={photo.src} alt={copy ? '' : photo.alt} width={1000} height={750} loading="lazy" decoding="async" />
                        <span className="moment-photo__caption"><span>{photo.title}</span><Expand size={16} aria-hidden="true" /></span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>}

      {current && createPortal(
        <Modal isOpen onClose={closeViewer} title={current.title} className="!max-w-5xl">
          <div className="moments-viewer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <MediaImage src={current.src} alt={current.alt} width={1000} height={750} />
          </div>
          <div className="moments-viewer__controls">
            <button type="button" className="action-secondary-detail" aria-label="Ảnh trước" onClick={() => setSelected(value => value === null ? null : (value - 1 + photos.length) % photos.length)}><ArrowLeft size={18} aria-hidden="true" /></button>
            <span aria-live="polite">{selected! + 1} / {photos.length}</span>
            <button type="button" className="action-secondary-detail" aria-label="Ảnh tiếp theo" onClick={() => setSelected(value => value === null ? null : (value + 1) % photos.length)}><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </Modal>, document.body,
      )}
    </section>
  );
}
