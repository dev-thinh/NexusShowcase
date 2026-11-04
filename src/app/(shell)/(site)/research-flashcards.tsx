'use client';

import { ErrorNotice } from '@/shared/ui/error-notice';

import { HomeText, useHomeText } from '@/features/publications/components/home-content-provider';
import { MediaImage } from '@/shared/ui/media-image';

import { useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { MomentsEditor } from '@/features/publications/components/moments-editor';
import { defaultResearchImages, researchImagesSchema } from '@/features/publications/model/research-images';
import type { MomentsGallery, MomentsPayload } from '@/features/publications/model/moments';
import { ResearchSectionHeading } from './research-section-heading';
import { notifySuccess } from '@/shared/dialogs/success';

export function ResearchFlashcards({ initialGallery }: { initialGallery?: MomentsPayload }) {
  const text = useHomeText();
  const directions = [
    { id: 'one', title: text.researchOneTitle, titleField: 'researchOneTitle', descriptionField: 'researchOneDescription', description: text.researchOneDescription, position: '50% 48%' },
    { id: 'two', title: text.researchTwoTitle, titleField: 'researchTwoTitle', descriptionField: 'researchTwoDescription', description: text.researchTwoDescription, position: '54% 54%' },
    { id: 'three', title: text.researchThreeTitle, titleField: 'researchThreeTitle', descriptionField: 'researchThreeDescription', description: text.researchThreeDescription, position: '50% 50%' },
  ] as const;
  const [gallery, setGallery] = useState<MomentsPayload>(initialGallery ?? { version: 0, photos: defaultResearchImages, isAdmin: false });
  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState('');
  const editButton = useRef<HTMLButtonElement>(null);

  async function startEditing() {
    setOpening(true);
    setMessage('');
    try {
      const response = await fetch('/api/home/research', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.isAdmin) throw new Error('Không mở được chỉnh sửa. Vui lòng kiểm tra phiên đăng nhập Admin và thử lại.');
      setGallery({ ...researchImagesSchema.parse(result), isAdmin: true, library: result.library });
      setEditing(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tải được ảnh. Vui lòng thử lại.');
    } finally { setOpening(false); }
  }

  function finishEditing(saved?: MomentsGallery) {
    if (saved) { setGallery({ ...saved, isAdmin: true }); void notifySuccess('Đã lưu ảnh hướng nghiên cứu.').then(() => editButton.current?.focus()); }
    setEditing(false);
    if (!saved) requestAnimationFrame(() => editButton.current?.focus());
  }

  return (
    <>
      <ResearchSectionHeading>{gallery.isAdmin && !editing && <button ref={editButton} type="button" className="moments-edit-button" aria-label="Chỉnh sửa ảnh hướng nghiên cứu" title="Chỉnh sửa ảnh" disabled={opening} onClick={() => void startEditing()}>{opening ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Pencil size={18} aria-hidden="true" />}</button>}</ResearchSectionHeading>
      {editing && <MomentsEditor variant="research" gallery={gallery} sharedLibrary={gallery.library} onSave={finishEditing} onCancel={() => finishEditing()} />}
      <ErrorNotice message={message} className="mt-3" />
    <div className="research-directions">
      {directions.map((direction, index) => {
        const photo = gallery.photos.find(photo => photo.slot === index);
        return (
        <article className="research-direction" key={direction.id} aria-labelledby={`research-direction-${index}`}>
          <div className="research-direction__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <MediaImage optimized src={photo?.src} alt={photo?.title || direction.title} width={1000} height={667} sizes="(max-width: 767px) calc(100vw - 32px), 400px" loading="eager" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: direction.position }} />
          </div>
          <div className="research-direction__body">
            <div className="research-direction__heading">
              <h3 id={`research-direction-${index}`} className="research-direction__title whitespace-pre-line [overflow-wrap:anywhere]">
                <HomeText field={direction.titleField} />
              </h3>
            </div>
            <p className="research-direction__description whitespace-pre-line [overflow-wrap:anywhere]"><HomeText field={direction.descriptionField} /></p>

          </div>
        </article>
      ); })}
    </div>
    </>
  );
}
