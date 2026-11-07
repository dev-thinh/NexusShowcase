'use client';
import { useI18n } from '@/shared/i18n/provider';


import { useMomentsLoop } from '@/features/publications/components/use-moments-loop';
import { ErrorNotice } from '@/shared/ui/error-notice';

import { HomeText } from '@/features/publications/components/home-content-provider';
import { MediaImage } from '@/shared/ui/media-image';

import { ArrowLeft, ArrowRight, Expand, Loader2, Pause, Pencil, Play } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/shared/ui/modal';
import { MomentPhotoViewer, prefetchMomentPhoto, type MomentPhotoOrigin } from './moment-photo-viewer';
import { defaultMoments, momentRows, momentPhotoPose, momentsSaveSchema, type MomentsPayload, type MomentsGallery } from '@/features/publications/model/moments';
import { MomentsEditor } from '@/features/publications/components/moments-editor';
import { notifySuccess } from '@/shared/dialogs/success';

export function HomeMoments({ initialGallery = { photos: defaultMoments, version: 0, isAdmin: false } }: { initialGallery?: MomentsPayload }) {
  const { t: tr } = useI18n();

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
    if (saved) { setGallery(saved); void notifySuccess('Đã lưu ảnh khoảnh khắc.').then(() => editButton.current?.focus()); }
    setEditing(false);
    setKeyboardBrowsing(false);
    if (!saved) requestAnimationFrame(() => editButton.current?.focus());
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
  useMomentsLoop(wallRef, paused || selected !== null || editing, keyboardBrowsing, gallery.version);
  const current = selected === null ? null : photos[selected];
  const [viewerOrigin, setViewerOrigin] = useState<MomentPhotoOrigin | null>(null);

  function thumbnailFor(id: string) {
    return [...(wallRef.current?.querySelectorAll<HTMLButtonElement>('.moment-photo') ?? [])]
      .find(button => button.dataset.photoId === id)?.querySelector('img');
  }
  function openViewer(index: number, button: HTMLButtonElement) {
    const image = button.querySelector('img');
    const bounds = image?.getBoundingClientRect();
    setViewerOrigin(bounds ? { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height } : null);
    setSelected(index);
  }
  function moveViewer(step: number) {
    setViewerOrigin(null);
    setSelected(value => value === null ? null : (value + step + photos.length) % photos.length);
  }
  const thumbnail = current ? thumbnailFor(current.id) : null;


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
    if (!keyboardBrowsing && window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches) {
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
      moveViewer(step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, photos.length]);

  return (
    <section ref={wallRef} className="moments-wall" aria-labelledby="moments-title" data-keyboard-browsing={keyboardBrowsing ? 'true' : undefined} data-paused={paused || selected !== null || editing ? 'true' : undefined}>
      <div className="moments-heading container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="home-section-heading">
          <p className="home-section-eyebrow"><HomeText field="momentsEyebrow">{tr("Hoạt động CLB")}</HomeText></p>
          <h2 id="moments-title" className="home-section-title"><HomeText field="momentsTitle">{tr("Khoảnh khắc sáng tạo")}</HomeText></h2>
        </div>
        <div className="moments-heading-actions">
          {initialGallery.isAdmin && !editing && <button ref={editButton} type="button" className="moments-edit-button" aria-label={tr("Chỉnh sửa ảnh khoảnh khắc")} title={tr("Chỉnh sửa ảnh")} disabled={opening} onClick={() => void startEditing()}>{opening ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Pencil size={18} aria-hidden="true" />}</button>}
        {!editing && hasMotion && <div className="moments-controls">
          <button type="button" className="moments-pause" aria-label={paused ? tr("Tiếp tục chuyển động") : tr("Tạm dừng chuyển động")} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
            {paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
          </button>
        </div>}
        </div>
      </div>

      {notice && <div className="container mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"><ErrorNotice message={tr(notice)} /></div>}
      {editing && <MomentsEditor gallery={gallery} protectedSources={protectedSources} onSave={finishEditing} onCancel={() => finishEditing()} />}
      {photos.length === 0 ? <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><MediaImage alt={tr("Khoảnh khắc CLB")} className="h-64 w-full rounded-lg" /></div> : <div className="moments-strips">
        {rows.map((row, laneIndex) => row.length > 0 && (
          <div className={`moments-lane${row.length < 3 ? ' moments-lane--static' : ''}`} key={laneIndex} data-row={laneIndex} data-motion={row.length >= 3 ? 'true' : 'false'} data-photo-count={row.length}>
            <div className={`moments-track${laneIndex === 1 ? ' moments-track--reverse' : ''}`}>
              {(row.length >= 3 ? [0, 1, 2] : [0]).map(copy => (
                <div className="moments-group" aria-hidden={copy > 0 || undefined} key={String(copy)}>
                  {row.map((photo, index) => {
                    const pose = momentPhotoPose(photo, index);
                    const photoIndex = photos.findIndex(item => item.id === photo.id);
                    return (
                      <button type="button" className={`moment-photo moment-photo--${photo.shape}`} key={photo.src} style={{ '--photo-tilt': pose.tilt, '--photo-offset': pose.offset } as CSSProperties} tabIndex={copy ? -1 : undefined} data-photo-id={photo.id} aria-label={tr("Xem ảnh: {0}", photo.title)} onPointerEnter={() => prefetchMomentPhoto(photo.src)} onFocus={() => prefetchMomentPhoto(photo.src)} onClick={event => openViewer(photoIndex, event.currentTarget)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <MediaImage optimized src={photo.src} alt={copy ? '' : photo.alt} width={1000} height={750} sizes="(max-width: 767px) 264px, 336px" loading={copy ? 'lazy' : 'eager'} decoding="async" />
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
        <Modal isOpen onClose={closeViewer} title={current.title} className="moments-viewer-modal !max-w-5xl">
          <MomentPhotoViewer key={current.id} src={current.src} alt={current.alt} previewSrc={thumbnail?.currentSrc || `${current.src}?w=384`} ratio={thumbnail?.naturalWidth && thumbnail.naturalHeight ? thumbnail.naturalWidth / thumbnail.naturalHeight : 4 / 3} origin={viewerOrigin} onReady={() => {
            if (photos.length < 2 || selected === null) return;
            prefetchMomentPhoto(photos[(selected + 1) % photos.length].src);
            prefetchMomentPhoto(photos[(selected - 1 + photos.length) % photos.length].src);
          }} />
          <div className="moments-viewer__controls">
            <button type="button" className="action-secondary-detail" aria-label={tr("Ảnh trước")} onClick={() => moveViewer(-1)}><ArrowLeft size={18} aria-hidden="true" /></button>
            <span aria-live="polite">{selected! + 1} / {photos.length}</span>
            <button type="button" className="action-secondary-detail" aria-label={tr("Ảnh tiếp theo")} onClick={() => moveViewer(1)}><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </Modal>, document.body,
      )}
    </section>
  );
}
