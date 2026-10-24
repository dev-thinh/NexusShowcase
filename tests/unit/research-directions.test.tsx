import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { defaultResearchImages } from '../fixtures/moments';
import { ResearchFlashcards } from '@/app/(shell)/(site)/research-flashcards';

it('pairs each research direction with an accessible local photograph and keeps headings readable outside it', () => {
  const html = renderToStaticMarkup(<ResearchFlashcards initialGallery={{ version: 0, isAdmin: false, photos: defaultResearchImages }} />);
  const images = [...html.matchAll(/<img[^>]+>/g)].map(match => match[0]);
  expect(images).toHaveLength(3);
  expect(images.every(image => image.includes('alt=') && image.includes('loading="lazy"') && image.includes('width=') && image.includes('height='))).toBe(true);
  expect(new Set(images.map(image => image.match(/src="([^"]+)"/)?.[1])).size).toBe(3);
  expect(html).not.toContain('data-media-placeholder');
  expect(html.match(/<h3/g)).toHaveLength(3);
  expect(html).toContain('Trí tuệ nhân tạo');
  expect(html).toContain('Robot tự hành');
  expect(html).toContain('IoT');
});

it('shows saved photos to visitors and editing controls only to admins', () => {
  const gallery = { version: 2, photos: defaultResearchImages.map((photo, index) => ({ ...photo, src: `/uploads/thumbnails/saved-${index}.webp`, title: `Ảnh nghiên cứu ${index}` })), isAdmin: false };
  const publicHtml = renderToStaticMarkup(<ResearchFlashcards initialGallery={gallery} />);
  expect(publicHtml).toContain('/uploads/thumbnails/saved-0.webp');
  expect(publicHtml).toContain('Ảnh nghiên cứu 0');
  expect(publicHtml).not.toContain('aria-label="Chỉnh sửa ảnh hướng nghiên cứu"');
  const adminHtml = renderToStaticMarkup(<ResearchFlashcards initialGallery={{ ...gallery, isAdmin: true }} />);
  expect(adminHtml).toContain('aria-label="Chỉnh sửa ảnh hướng nghiên cứu"');
  expect(adminHtml).toContain('class="moments-edit-button"');
  expect(adminHtml).toContain('lucide-pencil');
  expect(adminHtml).not.toContain('Chỉnh sửa 3 ảnh');
});

it('keeps empty research slots empty without shifting other photos or restoring defaults', () => {
  const html = renderToStaticMarkup(<ResearchFlashcards initialGallery={{ version: 1, isAdmin: false, photos: defaultResearchImages.slice(1) }} />);
  expect(html.match(/<img/g)).toHaveLength(2);
  expect(html).toContain('data-media-placeholder="true"');
  expect(html).not.toContain(defaultResearchImages[0].src);
});

it('renders shared placeholders for all initially empty research slots', () => {
 const html = renderToStaticMarkup(<ResearchFlashcards />);
 expect(html).not.toContain('<img');
 expect(html.match(/data-media-placeholder="true"/g)).toHaveLength(3);
});
