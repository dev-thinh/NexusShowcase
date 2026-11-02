import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { SectionEditor } from '@/features/submissions/components/section-editor';
import { ArticleBlockView } from '@/features/submissions/components/article-content';
import { serializeArticle, type ArticleBlock } from '@/features/submissions/model/article';
import { submissionValidationMessage, validationFailure } from '@/features/submissions/model/validation-result';
import { showcaseDraftInputSchema, showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
vi.mock('@/shared/dialogs/dialog-provider', () => ({ useDialog: () => ({ confirm: vi.fn() }) }));
vi.mock('@/features/assets/server/actions', () => ({ uploadFileAction: vi.fn() }));
vi.stubGlobal('React', React);
const image: ArticleBlock = { id: 'image', kind: 'IMAGE', url: '/uploads/thumbnails/figure.png', caption: 'Sơ đồ hệ thống', alt: '' };
const contentFor = (block: ArticleBlock) => serializeArticle({ version: 1, sections: [{ id: 'section', title: 'Kết quả', blocks: [block] }] });

it('accepts a complete article image with a caption without a separate description', () => {
  const result = showcaseSubmissionInputSchema.safeParse({ title: 'Robot', summary: 'Tóm tắt', type: 'RESEARCH_PAPER', content: contentFor(image), contributors: [{ externalName: 'Tác giả', role: 'CONTRIBUTOR', displayOrder: 0 }] });
  expect(result.success).toBe(true);
});

it.each(['IMAGE', 'DOCUMENT'] as const)('hides URL inputs for uploaded %s blocks and keeps the caption', kind => {
  const html = renderToStaticMarkup(<SectionEditor content={contentFor({ ...image, kind })} resources={[]} onChange={() => undefined} onBusy={() => undefined} />);
  expect(html).not.toContain('type="url"');
  expect(html).not.toContain('Mô tả ảnh');
  expect(html).toContain('Sơ đồ hệ thống');
});

it('keeps a URL field for videos', () => {
  const html = renderToStaticMarkup(<SectionEditor content={contentFor({ ...image, kind: 'VIDEO', url: '' })} resources={[]} onChange={() => undefined} onBusy={() => undefined} />);
  expect(html).toContain('type="url"');
});

it('uses the caption as image alternative text', () => {
  const html = renderToStaticMarkup(<ArticleBlockView block={{ ...image, alt: 'old-file-name.png' }} />);
  expect(html).toContain('alt="Sơ đồ hệ thống"');
});

it('identifies the exact section and block when a filled text block is too long', () => {
  const result = showcaseDraftInputSchema.safeParse({ title: 'Robot', content: contentFor({ id: 'text', kind: 'TEXT', text: 'a'.repeat(20001) }) });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toContain('Section 1');
    expect(result.error.issues[0].message).toContain('khối 1');
    expect(result.error.issues[0].message).toContain('20000');
  }
});

it('validates a complete post with uploaded image, PDF, video and detail links', () => {
  const content = serializeArticle({ version: 1, sections: [{ id: 'results', title: 'Kết quả', blocks: [
    { id: 'body', kind: 'TEXT', text: 'Kết quả thử nghiệm đã hoàn thành.' },
    image,
    { id: 'pdf', kind: 'DOCUMENT', url: '/uploads/documents/report.pdf', caption: 'Báo cáo', alt: '', fileName: 'Báo cáo.pdf', mimeType: 'application/pdf', fileSize: 17682556 },
    { id: 'video', kind: 'VIDEO', url: 'https://www.youtube.com/watch?v=sH502hf7288', caption: 'Demo', alt: '' },
    { id: 'link', kind: 'LINK', url: 'https://www.facebook.com/', caption: 'Tham khảo', alt: '' },
  ] }] });
  const result = showcaseSubmissionInputSchema.safeParse({ title: 'TEST', summary: 'TEST', citationEnabled: false, type: 'RESEARCH_PAPER', categoryId: 'cmvaheq8u0001zsw915gqtfk7', thumbnailUrl: '/uploads/thumbnails/cover.jpg', publishedYear: 2026, content, resources: [], contributors: [{ userId: 'cmvb88fo10000zsx8u3jdadgo', role: 'CONTRIBUTOR', displayOrder: 0 }] });
  expect(result.success).toBe(true);
});

it('reports the actual validation failure in client and server messages', () => {
  const result = showcaseDraftInputSchema.safeParse({ title: 'Robot', content: contentFor({ id: 'text', kind: 'TEXT', text: 'a'.repeat(20001) }) });
  if (result.success) throw new Error('Expected text length validation');
  expect(submissionValidationMessage(result.error)).toContain('Section 1, khối 1: Văn bản vượt giới hạn 20000 ký tự.');
  expect(validationFailure(result.error)).toMatchObject({ success: false, error: submissionValidationMessage(result.error) });
});

it('places content errors directly below the affected block', () => {
  const html = renderToStaticMarkup(<SectionEditor content={contentFor({ id: 'text', kind: 'TEXT', text: '' })} resources={[]} errors={{ 'content.sections.0.blocks.0.text': ['Hãy bổ sung văn bản.'] }} onChange={() => undefined} onBusy={() => undefined} />);
  expect(html).toContain('data-field-error="content.sections.0.blocks.0.text"');
  expect(html.indexOf('Hãy bổ sung văn bản.')).toBeGreaterThan(html.indexOf('</textarea>'));
  expect(html).toContain('text-red-700');
});
