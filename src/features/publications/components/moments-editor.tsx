'use client';
import { useI18n } from '@/shared/i18n/provider';


import { MediaImage } from '@/shared/ui/media-image';
import { FilePicker } from '@/shared/ui/file-picker';
import { notifySuccess } from '@/shared/dialogs/success';

import { Check, ChevronLeft, ChevronRight, ImageMinus, Loader2, Save, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/shared/ui/modal';
import { CustomSelect } from '@/shared/ui/custom-select';
import { momentsSaveSchema, type MomentPhoto, type MomentsGallery } from '../model/moments';
import { researchImagesSchema } from '../model/research-images';
import { mergePhotoLibrary } from '../model/photo-library';
import { placeMomentPhoto } from '../model/moments-placement';
import { useMomentsDrag } from './use-moments-drag';

type Props = { gallery: MomentsGallery; onSave: (gallery: MomentsGallery) => void; onCancel: () => void; variant?: 'moments' | 'research'; sharedLibrary?: MomentsGallery; protectedSources?: string[] };


export function MomentsEditor({ gallery, onSave, onCancel, variant = 'moments', sharedLibrary, protectedSources = [] }: Props) {
  const { t: tr } = useI18n();

  const research = variant === 'research';
  const columns = research ? 3 : 6;
  const slotLabel = (slot: number) => research ? tr("Ảnh {0}", slot + 1) : tr("{0}, ô {1}", tr(slot < 6 ? "Hàng trên" : "Hàng dưới"), slot % 6 + 1);
  const [initialPhotos] = useState(() => research && sharedLibrary ? mergePhotoLibrary(gallery.photos, sharedLibrary.photos) : gallery.photos);
  const [photos, setPhotos] = useState(() => initialPhotos.map(photo => ({ ...photo })));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'arrange' | 'details'>('arrange');
  const [busy, setBusy] = useState<'upload' | 'save' | null>(null);
  const [error, setError] = useState('');
  const locked = busy !== null;
  const selected = photos.find(photo => photo.slot === selectedSlot);
  const library = photos.filter(photo => !unusedOnly || photo.slot === null);
  const dirty = JSON.stringify(photos) !== JSON.stringify(initialPhotos);
  const protectedAssets = new Set(research ? sharedLibrary?.photos.filter(photo => photo.slot !== null).map(photo => photo.src) : protectedSources);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [dragNotice, setDragNotice] = useState('');
  const drag = useMomentsDrag(editorRef, locked, (photoId, slot) => {
    setPhotos(current => placeMomentPhoto(current, photoId, slot));
    setSelectedSlot(slot);
    setMobilePanel('arrange');
    setDragNotice(tr("Đã đặt ảnh vào {0}. Chọn Lưu thay đổi để cập nhật.", slotLabel(slot).toLowerCase()));
  });
  const draggedPhoto = drag ? photos.find(photo => photo.id === drag.photoId) : null;

  useEffect(() => { contentRef.current?.scrollTo({ top: 0 }); }, [mobilePanel]);

  useEffect(() => {
    if (!dirty && !locked) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, locked]);

  function patch(id: string, change: Partial<MomentPhoto>) {
    setPhotos(current => current.map(photo => photo.id === id ? { ...photo, ...change } : photo));
  }
  function choose(photo: MomentPhoto) {
    setMobilePanel('details');
    if (photo.slot !== null) { setSelectedSlot(photo.slot); return; }
    setPhotos(current => placeMomentPhoto(current, photo.id, selectedSlot));
  }
  function move(step: number) {
    if (!selected) return;
    const target = selectedSlot + step;
    setPhotos(current => placeMomentPhoto(current, selected.id, target));
    setSelectedSlot(target);
  }

  async function upload(files: File[]) {
    if (!files.length || locked) return;
    if (files.length > 40 - photos.length) {
      setError(tr("Thư viện tối đa 40 ảnh. Bạn chỉ có thể thêm {0} ảnh nữa.", 40 - photos.length)); return;
    }
    setError(''); setBusy('upload');
    const errors: string[] = [];
    let uploadedCount = 0;
    try {
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) {
          errors.push(tr("{0}: Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.", file.name));
          continue;
        }
        try {
          const form = new FormData(); form.set('file', file); form.set('type', 'thumbnail');
          const response = await fetch('/api/upload', { method: 'POST', body: form });
          const result = await response.json();
          if (!response.ok || typeof result.url !== 'string') throw new Error(result.error || 'Không tải được ảnh.');
          setPhotos(current => [...current, { id: crypto.randomUUID(), src: result.url, title: '', alt: '', shape: 'wide', tilt: '-2deg', visible: false, slot: null }]);
          uploadedCount += 1;
        } catch (cause) {
          errors.push(tr("{0}: {1}", file.name, tr(cause instanceof Error ? cause.message : 'Không tải được ảnh. Vui lòng thử lại.')));
        }
      }
      if (uploadedCount && !errors.length) await notifySuccess(`Đã tải ${uploadedCount} ảnh vào thư viện chỉnh sửa. Bấm Lưu thay đổi để lưu thư viện.`);
    } finally { setError(errors.join('\n')); setBusy(null); }
  }

  async function save() {
    if (locked) return;
    const schema = research ? researchImagesSchema : momentsSaveSchema;
    const parsed = schema.safeParse({ version: gallery.version, photos: research ? photos.filter(photo => photo.slot !== null).sort((a, b) => a.slot! - b.slot!) : photos });
    if (!parsed.success) { setError('Điền đầy đủ tiêu đề cho ảnh đang chỉnh sửa.'); return; }
    setBusy('save'); setError('');
    try {
      const retained = new Set(photos.map(photo => photo.src));
      const library = research && sharedLibrary ? {
        version: sharedLibrary.version,
        photos: mergePhotoLibrary(sharedLibrary.photos.filter(photo => retained.has(photo.src)), photos),
      } : undefined;
      const response = await fetch(research ? '/api/home/research' : '/api/home/moments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...parsed.data, ...(library ? { library } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không lưu được ảnh.');
      onSave(schema.parse(result));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được thay đổi. Vui lòng thử lại.'); }
    finally { setBusy(null); }
  }

  return (
    <Modal isOpen onClose={onCancel} closeDisabled={locked || !!drag} title={research ? tr("Chỉnh sửa ảnh hướng nghiên cứu") : tr("Chỉnh sửa khoảnh khắc")} className="moments-editor-modal">
      <div ref={editorRef} className="moments-editor" aria-busy={locked} data-dragging={drag ? 'true' : undefined}>
        <p role="status" className="sr-only">{drag ? tr("Đang kéo ảnh. Thả vào một vị trí, hoặc nhấn Escape để hủy.") : tr(dragNotice)}</p>
        <div className="moments-editor__mobile-tabs" role="group" aria-label={tr("Chế độ chỉnh sửa")}>
          <button type="button" className={mobilePanel === 'arrange' ? 'action-primary-detail' : 'action-secondary-detail'} disabled={locked} aria-pressed={mobilePanel === 'arrange'} onClick={() => setMobilePanel('arrange')}>{tr("Sắp xếp ảnh")}</button>
          <button type="button" className={mobilePanel === 'details' ? 'action-primary-detail' : 'action-secondary-detail'} disabled={locked} aria-pressed={mobilePanel === 'details'} onClick={() => setMobilePanel('details')}>{tr("Sửa ảnh")}</button>
        </div>
        <p className="moments-editor__drag-hint">{tr("Chạm và kéo ảnh để đổi vị trí, không cần giữ lâu. Chạm nhanh để chỉnh sửa; vuốt ngoài ảnh để cuộn.")}</p>
        <div ref={contentRef} className="moments-editor__scroll">
          {error && <p role="alert" className="mb-4 whitespace-pre-line rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{tr(error)}</p>}
          <fieldset disabled={locked} className="moments-editor__workspace" data-panel={mobilePanel}>
            <legend className="sr-only">{tr("Ảnh đang hiển thị và thư viện ảnh")}</legend>
            <section className="moments-editor__stage" aria-label={tr("Bố trí ảnh trang chủ")}>
            {(research ? [0] : [0, 1]).map(row => {
              const count = photos.filter(photo => photo.slot !== null && Math.floor(photo.slot / 6) === row).length;
              return <div key={row} className="moments-editor__row">
                {!research && <div className="moments-editor__row-heading"><span>{row === 0 ? tr("Hàng trên") : tr("Hàng dưới")}</span><span>{count}/6 · {count === 0 ? tr("Đang ẩn") : count < 3 ? tr("Đứng yên") : tr("Chuyển động")}</span></div>}
                <div className="moments-editor__slots" style={research ? { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } : undefined} role="group" aria-label={research ? tr("Ảnh hướng nghiên cứu") : row === 0 ? tr("Ảnh hàng trên") : tr("Ảnh hàng dưới")}>
                  {Array.from({ length: columns }, (_, column) => {
                    const slot = row * 6 + column;
                    const photo = photos.find(item => item.slot === slot);
                    return <button key={slot} type="button" className={`moments-editor__slot${photo ? '' : ' moments-editor__slot--empty'}`} data-moment-slot={slot} data-moment-drag={photo?.id} data-drag-source={drag?.photoId === photo?.id && !!photo ? 'true' : undefined} data-drop-target={drag?.over === slot ? 'true' : undefined} aria-label={`${slotLabel(slot)}: ${photo?.title ?? tr('Trống')}`} aria-pressed={selectedSlot === slot} onDragStart={event => event.preventDefault()} onClick={() => { setSelectedSlot(slot); setMobilePanel(photo ? 'details' : 'arrange'); }}>
                      {photo ? <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <MediaImage optimized src={photo.src} alt={photo.alt} width={180} height={135} sizes={research ? '(max-width: 767px) 30vw, 260px' : '130px'} draggable={false} />
                        <span className="moments-editor__slot-title">{photo.title}</span>
                      </> : <MediaImage className="h-full w-full" alt={tr("Vị trí ảnh trống")} />}
                      <span className="moments-editor__slot-number">{column + 1}</span>
                    </button>;
                  })}
                </div>
              </div>;
            })}
            </section>
            <section className="moments-editor__inspector" aria-label={tr("Ảnh đang chọn")}>
              <div className="moments-editor__section-heading"><h4>{slotLabel(selectedSlot)}</h4></div>
              {selected ? <>
                <div className="moments-editor__preview-stage">
                  <figure className={`moments-editor__preview-card moment-photo moment-photo--${research ? 'wide' : selected.shape}`} aria-label={tr("Xem trước ảnh")} data-preview-shape={research ? 'wide' : selected.shape}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <MediaImage optimized src={selected.src} alt={selected.title} width={320} height={240} sizes="320px" draggable={false} />
                    <figcaption className="moment-photo__caption">{selected.title}</figcaption>
                  </figure>
                </div>
                <div className="moments-editor__photo-actions">
                  <div className="moments-editor__move" role="group" aria-label={tr("Di chuyển ảnh")}>
                    <button type="button" className="action-secondary-detail moments-editor__icon" aria-label={tr("Đưa ảnh sang trái")} title={tr("Đưa ảnh sang trái")} disabled={selectedSlot % columns === 0} onClick={() => move(-1)}><ChevronLeft size={16} aria-hidden="true" /></button>
                    <button type="button" className="action-secondary-detail moments-editor__icon" aria-label={tr("Đưa ảnh sang phải")} title={tr("Đưa ảnh sang phải")} disabled={selectedSlot % columns === columns - 1} onClick={() => move(1)}><ChevronRight size={16} aria-hidden="true" /></button>
                  </div>
                  <button type="button" className="action-secondary-detail moments-editor__button moments-editor__remove" title={tr("Gỡ ảnh, giữ lại trong thư viện")} onClick={() => patch(selected.id, { slot: null, visible: false })}><ImageMinus size={16} aria-hidden="true" />{tr("Gỡ ảnh")}</button>
                </div>
              <p className="text-xs text-slate-500">{tr("Ảnh gợi ý: ngang 1200 × 900, vuông 1200 × 1200, dọc 900 × 1200 px.")}</p>
              <div className="moments-editor__fields">
                <label className="moments-editor__field">{tr("Tiêu đề")}<input required maxLength={160} value={selected.title} onChange={event => patch(selected.id, { title: event.target.value, alt: event.target.value })} /></label>
                {!research && <div className="moments-editor__field"><span>{tr("Khung ảnh")}</span><CustomSelect ariaLabel={tr("Khung ảnh")} disabled={locked} value={selected.shape} onChange={value => patch(selected.id, { shape: value as MomentPhoto['shape'] })} options={[{ value: 'wide', label: tr('Ngang (4:3)') }, { value: 'portrait', label: tr("Dọc (3:4)") }, { value: 'square', label: tr("Vuông (1:1)") }]} /></div>}
              </div></> : <p className="text-sm text-slate-500">{tr("Chọn ảnh trong thư viện để đặt vào vị trí này.")}</p>}
            </section>
            <section className="moments-editor__library" aria-label={tr("Thư viện ảnh")}>
              <div className="moments-editor__library-heading">
                <h4 className="font-semibold">{tr("Thư viện ảnh") + " "}<span className="text-sm font-normal text-slate-500">{photos.length}/40</span></h4>
                <div className="moments-editor__library-actions">
                  <CustomSelect className="moments-editor__filter" ariaLabel={tr("Lọc thư viện ảnh")} disabled={locked} value={unusedOnly ? 'unused' : 'all'} onChange={value => setUnusedOnly(value === 'unused')} options={[{ value: 'all', label: tr("Tất cả") }, { value: 'unused', label: tr("Chưa sử dụng") }]} />
                  <FilePicker label={tr("Tải ảnh mới")} multiple busy={busy === 'upload'} showFileName={false} disabled={locked || photos.length >= 40} accept="image/jpeg,image/png,image/webp" aria-label={tr("Tải ảnh mới vào thư viện")} onChange={event => { const files = Array.from(event.target.files ?? []); void upload(files); }} />
                </div>
              </div>
              {library.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">{unusedOnly ? tr("Không có ảnh chưa sử dụng.") : tr("Thư viện chưa có ảnh.")}</p> : <div className="moments-editor__library-grid">
                {library.map(photo => <div key={photo.id} className="moments-editor__asset">
                  <button type="button" className="moments-editor__asset-select" data-moment-drag={photo.id} data-drag-source={drag?.photoId === photo.id ? 'true' : undefined} aria-label={tr("Chọn ảnh: {0}", photo.title || tr('Ảnh chưa có tiêu đề'))} onDragStart={event => event.preventDefault()} onClick={() => choose(photo)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <MediaImage optimized src={photo.src} alt={photo.alt} width={180} height={135} sizes="(max-width: 767px) 30vw, 200px" loading="lazy" draggable={false} />
                    {photo.slot !== null && <span className="moments-editor__used"><Check size={12} aria-hidden="true" />{research ? tr("Ảnh") : photo.slot < 6 ? tr("Trên") : tr("Dưới")} {photo.slot % 6 + 1}</span>}
                    <span className="moments-editor__asset-title">{photo.title || tr("Ảnh chưa có tiêu đề")}</span>
                  </button>
                  <button type="button" className="action-secondary-detail moments-editor__asset-delete" disabled={photo.slot !== null || protectedAssets.has(photo.src)} aria-label={tr("Xóa khỏi thư viện: {0}", photo.title || tr('Ảnh chưa có tiêu đề'))} title={protectedAssets.has(photo.src) ? tr("Ảnh đang được sử dụng ở mục khác") : photo.slot !== null ? tr("Gỡ ảnh khỏi hàng trước khi xóa") : tr("Xóa khỏi thư viện")} onClick={() => setPhotos(current => current.filter(item => item.id !== photo.id))}><Trash2 size={16} aria-hidden="true" /></button>
                </div>)}
              </div>}
            </section>
          </fieldset>
        </div>
        <div className="moments-editor__footer"><p className="text-xs text-slate-500">{tr("Chỉ cập nhật trang chủ khi lưu.")}</p><div className="moments-editor__footer-actions">
          <button type="button" className="action-secondary-detail moments-editor__button" disabled={locked} onClick={onCancel}><X size={16} aria-hidden="true" />{tr("Hủy")}</button>
          <button type="button" className="action-primary-detail moments-editor__button" disabled={locked} onClick={() => void save()}>{busy === 'save' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}{tr("Lưu thay đổi")}</button>
        </div></div>
        {drag && draggedPhoto && createPortal(<div className="moments-drag-preview" style={{ left: drag.x - drag.offsetX, top: drag.y - drag.offsetY, width: drag.width, height: drag.height }} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <MediaImage optimized src={draggedPhoto.src} alt="" width={180} height={135} sizes="(max-width: 767px) 30vw, 200px" draggable={false} />
        </div>, document.body)}
      </div>
    </Modal>
  );
}
