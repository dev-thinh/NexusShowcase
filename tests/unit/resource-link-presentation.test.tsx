import { CitationModal } from '@/features/publications/components/citation-modal';
import { submissionResourceSchema } from '@/features/submissions/model/input';
import { CardResourceLink } from '@/features/publications/components/card-resource-link';
import { ResourceLinks } from '@/features/submissions/components/resource-links';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';

it('shows a direct GitHub icon only for valid source URLs and deduplicates links', () => {
  const link = { type: 'GITHUB', url: 'https://github.com/lab/project', label: 'Mã nguồn' };
  const html = renderToStaticMarkup(<CardResourceLink detailHref="/works/work" links={[link, link]} />);
  expect(html).toContain('href="https://github.com/lab/project"');
  expect(html).toContain('aria-label="Mã nguồn GitHub: Mã nguồn"');
  expect(html).toContain('<svg');
  expect(html.match(/<a /g)).toHaveLength(1);
});

it.each(['https://example.com/repo', 'https://github.com.evil.com/lab/repo', 'https://github.com', 'javascript://github.com/lab/repo', 'https://evil@github.com/lab/repo'])('omits non-source or misleading URLs: %s', url => {
  expect(renderToStaticMarkup(<CardResourceLink detailHref="/works/work" links={[{ type: 'GITHUB', url }]} />)).toBe('');
});

it('centers resource button labels and preserves download names without icons', () => {
  const html = renderToStaticMarkup(<ResourceLinks resources={[{ kind: 'LINK', label: 'Tài nguyên', url: 'https://example.com' }]} />);
  expect(html).toContain('justify-center text-center');
  expect(html).not.toContain('justify-start');
  expect(html).not.toContain('<svg');
});

it('validates GitHub quick links on the server while allowing general detail links', () => {
  const resource = { kind: 'LINK', label: 'Mã nguồn', linkType: 'GITHUB', url: 'https://github.com/lab/project' };
  expect(submissionResourceSchema.safeParse(resource).success).toBe(true);
  expect(submissionResourceSchema.safeParse({ ...resource, url: 'https://example.com/repo' }).success).toBe(false);
  expect(submissionResourceSchema.safeParse({ ...resource, linkType: 'OTHER', url: 'https://example.com/repo' }).success).toBe(true);
});

it('omits every citation trigger when citation is disabled', () => {
  const item = { title: 'Bài viết', slug: 'work', contributors: [], citationEnabled: false };
  for (const triggerVariant of ['button', 'badge', 'icon', 'resource'] as const) {
    expect(renderToStaticMarkup(<CitationModal item={item} triggerVariant={triggerVariant} />)).toBe('');
  }
  expect(renderToStaticMarkup(<CitationModal item={{ ...item, citationEnabled: true }} triggerVariant="icon" />)).toContain('Trích dẫn công trình');
});

it('shows visible text beside quick access icons', () => {
  expect(renderToStaticMarkup(<CitationModal item={{ title: 'Test', slug: 'test', contributors: [] }} triggerVariant="icon" />)).toContain('<span>Cite</span>');
  expect(renderToStaticMarkup(<CardResourceLink detailHref="/works/test" links={[{ type: 'GITHUB', url: 'https://github.com/lab/repo' }]} />)).toContain('<span>GitHub</span>');
});
