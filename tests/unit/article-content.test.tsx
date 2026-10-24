import { createMemberInputSchema } from '@/features/identity/model/member-input';
import { ArticleContent } from '@/features/submissions/components/article-content';
import { ARTICLE_PREFIX, articleFromLegacy, articleResources, articleSubmissionErrors, parseArticleContent, serializeArticle } from '@/features/submissions/model/article';
import { showcaseDraftInputSchema, showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import { parseVideoEmbedUrl } from '@/shared/lib/video-parser';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.stubGlobal('React', React);
const contributor = { externalName: 'Tác giả', role: 'CONTRIBUTOR' as const, displayOrder: 0 };
const doc = articleFromLegacy('Kết quả **thử nghiệm**', [{ kind: 'IMAGE', label: 'Biểu đồ', url: '/uploads/thumbnails/chart.png' }, { kind: 'LINK', label: 'Demo', url: 'https://youtu.be/dQw4w9WgXcQ', linkType: 'VIDEO_EMBED' }, { kind: 'LINK', label: 'GitHub', url: 'https://github.com/lab/robot' }]);

describe('section article documents', () => {
  it('converts legacy text, images and video without dropping their order or URLs', () => {
    const content = serializeArticle(doc);
    expect(parseArticleContent(content)).toEqual(doc);
    expect(articleFromLegacy(content, [])).toEqual(doc);
    expect(articleResources(content).map(r => r.url)).toEqual(['/uploads/thumbnails/chart.png', 'https://youtu.be/dQw4w9WgXcQ', 'https://github.com/lab/robot']);
  });
  it('keeps incomplete URLs editable without replacing the document with legacy JSON', () => {
    const editing = structuredClone(doc);
    editing.sections[1].blocks[1] = { id: 'video', kind: 'VIDEO', url: 'https:/', caption: '', alt: '' };
    expect(articleFromLegacy(serializeArticle(editing))).toEqual(editing);
    expect(showcaseDraftInputSchema.safeParse({ title: 'Robot', content: serializeArticle(editing) }).success).toBe(false);
  });
  it('preserves Vietnamese text, whitespace and oversized blocks throughout editing', () => {
    const editing = structuredClone(doc);
    editing.sections[0].title = '  Kết quả nghiên cứu ';
    editing.sections[0].blocks[0] = { id: 'long-text', kind: 'TEXT', text: 'Tiếng Việt có dấu '.repeat(1500) };
    const content = serializeArticle(editing);
    expect(articleFromLegacy(content)).toEqual(editing);
    expect(articleFromLegacy(serializeArticle(articleFromLegacy(content)))).toEqual(editing);
    expect(showcaseDraftInputSchema.safeParse({ title: 'Robot', content }).success).toBe(false);
  });
  it('allows abstract-only projects and requires detail or a full-text source for research', () => {
    const input = { title: 'Robot', summary: 'Tóm tắt', contributors: [contributor], content: serializeArticle({ version: 1, sections: [] }) };
    expect(showcaseSubmissionInputSchema.safeParse(input).success).toBe(true);
    expect(showcaseSubmissionInputSchema.safeParse({ ...input, summary: '' }).success).toBe(false);
    expect(showcaseSubmissionInputSchema.safeParse({ ...input, type: 'RESEARCH_PAPER' }).success).toBe(false);
    expect(showcaseSubmissionInputSchema.safeParse({ ...input, type: 'RESEARCH_PAPER', content: serializeArticle(doc) }).success).toBe(true);
  });
  it('rejects malformed content, script URLs, duplicate ids and empty sections on submission', () => {
    expect(showcaseDraftInputSchema.safeParse({ title: 'Bad', content: ARTICLE_PREFIX + '{bad' }).success).toBe(false);
    const duplicate = structuredClone(doc); duplicate.sections[1].id = duplicate.sections[0].id;
    expect(parseArticleContent(serializeArticle(duplicate))).toBeNull();
    const unsafe = structuredClone(doc); unsafe.sections[1].blocks[1] = { id: 'unsafe', kind: 'LINK', url: 'javascript:alert(1)', caption: '', alt: '' };
    expect(parseArticleContent(serializeArticle(unsafe))).toBeNull();
    expect(articleSubmissionErrors(serializeArticle({ version: 1, sections: [{ id: 'empty', title: '', blocks: [] }] }))).toHaveLength(2);
  });
  it('renders media in its authored section and escapes arbitrary HTML', () => {
    const content = serializeArticle(articleFromLegacy('<script>alert(1)</script> **Kết quả**', [{ kind: 'LINK', label: 'Mã nguồn', url: 'https://github.com/lab/robot' }]));
    const html = renderToStaticMarkup(<ArticleContent content={content} />);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<strong>Kết quả</strong>');
    expect(html).toContain('id="section-2"');
    expect(html).toContain('https://github.com/lab/robot');
  });
  it('only embeds videos from exact supported hosts', () => {
    expect(parseVideoEmbedUrl('https://evil.test/youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseVideoEmbedUrl('https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseVideoEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(parseVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
  it('does not allow granting the retired editor role', () => {
    expect(createMemberInputSchema.safeParse({ fullName: 'Editor', email: 'editor@test', role: 'EDITOR' }).success).toBe(false);
  });
});
