vi.mock('@/shared/lib/deferred-fetch', () => ({ fetchDeferredJson: async (url: string) => {
  const { GET } = await import('@/app/api/home/route');
  return (await GET(new Request('http://localhost' + url))).json();
} }));
vi.mock('@/features/members/server/queries', () => ({ getHomeMembers: mocks.members }));
vi.mock('server-only', () => ({}));
import CategoryPage from '@/app/(shell)/(site)/category/[slug]/page';
import ExplorePage from '@/app/(shell)/(site)/explore/page';
import { loadHomeFeatured } from '@/app/(shell)/(site)/home-sections';
import { CitationModal } from '@/features/publications/components/citation-modal';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn(), members: vi.fn(), category: vi.fn() }));
vi.mock('@/server/db/prisma', () => ({ prisma: {
  showcaseItem: { findMany: mocks.findMany, count: mocks.count },
  user: { findMany: mocks.members }, category: { findUnique: mocks.category },
} }));
vi.mock('@/features/identity/server/session', () => ({ getSession: async () => null }));
vi.mock('@/app/(shell)/_components/navbar', () => ({ Navbar: () => null }));
vi.mock('@/shared/ui/academic-footer', () => ({ AcademicFooter: () => null }));
vi.mock('@/shared/ui/modal', () => ({ Modal: () => null }));
vi.mock('@/features/publications/server/actions', () => ({ setShowcasePinAction: vi.fn(), setShowcaseVisibilityAction: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }), notFound: vi.fn(), redirect: vi.fn() }));

const item = {
  id: 'paper-1', slug: 'paper-one', title: 'A research paper', summary: 'Abstract', type: 'RESEARCH_PAPER',
  status: 'PUBLISHED', visibility: 'PUBLIC', publishedYear: 2026, thumbnailUrl: null, issuer: null,
  contributors: [], attachments: [], links: [{ type: 'PAPER_URL', label: 'Original', url: 'https://example.com/paper' }],
  category: { id: 'papers', name: 'Papers', slug: 'bai-bao-khoa-hoc' },
};
beforeEach(() => {
  vi.stubGlobal('React', React);
  mocks.findMany.mockResolvedValue([item]);
  mocks.count.mockResolvedValue(1);
  mocks.members.mockResolvedValue([]);
  mocks.category.mockResolvedValue(item.category);
});

async function citationGroups(node: React.ReactNode): Promise<React.ReactElement[]> {
  if (Array.isArray(node)) return (await Promise.all(node.map(citationGroups))).flat();
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return [];
  if (typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') {
    return citationGroups(await (node.type as (props: object) => Promise<React.ReactNode>)(node.props));
  }
  const children = React.Children.toArray(node.props.children);
  if (children.some(child => React.isValidElement(child) && child.type === CitationModal)) return [node];
  return (await Promise.all(children.map(citationGroups))).flat();
}

describe('rendered citation action grouping', () => {
  it.each(['home', 'library', 'category'] as const)('groups detail, citation and original-paper actions in %s', async view => {
    const page = view === 'category'
      ? await CategoryPage({ params: Promise.resolve({ slug: 'bai-bao-khoa-hoc' }), searchParams: Promise.resolve({}) })
      : view === 'home' ? await loadHomeFeatured(new AbortController().signal) : await ExplorePage({ searchParams: Promise.resolve({ q: 'paper' }) });
    const groups = await citationGroups(page);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      const html = renderToStaticMarkup(group);
      expect(html).toMatch(/<a[^>]+href="[^"]*\/showcase\/paper-one[^"]*"[^>]*>Xem công trình/);
      expect(html).toMatch(/<button[^>]*><span>Trích dẫn khoa học \(Cite\)<\/span><\/button>/);
      expect(html).toContain('href="https://example.com/paper"');
      expect(html).toContain('Bài báo gốc');
    }
  });
});
