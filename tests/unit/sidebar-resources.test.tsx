import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { articleFromLegacy, serializeArticle, publicationResources, standaloneResources, articleResources } from '@/lib/article-content';
import { ResourceLinks } from '@/components/resource-links';
import { createInitialSubmissionState } from '@/components/submission/use-submission-editor';
import type { SubmissionResource } from '@/lib/submission-types';
vi.stubGlobal('React', React);
vi.mock('@/actions/showcase-actions', () => ({ saveShowcaseDraftAction: vi.fn(), submitShowcaseForReviewAction: vi.fn() }));

const dataset: SubmissionResource = { kind: 'LINK', label: 'Tải dataset', url: 'https://example.com/dataset.zip', linkType: 'OTHER' };
const pdf: SubmissionResource = { kind: 'DOCUMENT', label: 'Báo cáo', url: '/uploads/documents/report.pdf' };
const content = serializeArticle(articleFromLegacy('Nội dung', [{ kind: 'LINK', label: 'Nguồn tham khảo', url: 'https://example.com/reference' }]));

describe('sidebar resources', () => {
  it('keeps resources through a draft round trip without copying them into the article', () => {
    const published = publicationResources(content, [dataset, pdf]);
    const state = createInitialSubmissionState({ content, resources: published });
    expect(state.data.resources).toEqual([dataset, pdf]);
    expect(state.data.content).toBe(content);
    expect(publicationResources(state.data.content ?? '', (state.data.resources ?? []))).toEqual(published);
    expect(standaloneResources(content, published)).toEqual([dataset, pdf]);
  });
  it('keeps legacy resources in the sidebar when editing plain text', () => {
    const state = createInitialSubmissionState({ content: 'Nội dung cũ', resources: [dataset, pdf] });
    expect(state.data.resources).toEqual([dataset, pdf]);
    expect(articleResources(state.data.content ?? '')).toEqual([]);
  });
  it('removes deleted sidebar resources while preserving embedded links', () => {
    expect(publicationResources(content, [])).toEqual(articleResources(content));
    expect(publicationResources(content, [...articleResources(content), dataset, dataset])).toHaveLength(2);
  });
  it('renders labeled cards for external downloads and uploaded PDFs without icons', () => {
    const markup = renderToStaticMarkup(<ResourceLinks resources={[dataset, pdf]} />);
    expect(markup).toContain('Tải dataset');
    expect(markup).toContain('href="https://example.com/dataset.zip"');
    expect(markup).toContain('href="/uploads/documents/report.pdf"');
    expect(markup).toContain('action-secondary-detail');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain('<svg');
  });
});
