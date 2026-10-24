vi.mock('@/shared/lib/deferred-fetch', () => ({ fetchDeferredJson: async (url: string) => {
  const { GET } = await import('@/app/api/home/route');
  return (await GET(new Request('http://localhost' + url))).json();
} }));
vi.mock('@/features/members/server/queries', () => ({ getHomeMembers: mocks.members }));
vi.mock('server-only', () => ({}));
import HomePage from '@/app/(shell)/(site)/page';
import ExplorePage from '@/app/(shell)/(site)/explore/page';
import { loadHomeFeatured } from '@/app/(shell)/(site)/home-sections';
import { HomeFeaturedSection, HomeMembersSection } from '@/app/(shell)/(site)/home-sections';
import { MemberPagination } from '@/shared/ui/member-pagination';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role?: string } },
  count: vi.fn(), findMany: vi.fn(), members: vi.fn(),
}));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: { count: mocks.count, findMany: mocks.findMany }, user: { findMany: mocks.members } } }));
vi.mock('@/features/publications/server/actions', () => ({ setShowcasePinAction: vi.fn(), setShowcaseVisibilityAction: vi.fn() }));
vi.mock('@/features/identity/server/auth', () => ({ auth: () => mocks.session }));
vi.mock('@/app/(shell)/_components/navbar', () => ({ Navbar: () => null }));
vi.mock('@/shared/ui/academic-footer', () => ({ AcademicFooter: () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

beforeEach(() => {
  vi.stubGlobal('React', React);
  vi.clearAllMocks();
  mocks.session = null;
  mocks.count.mockResolvedValue(25);
  mocks.findMany.mockResolvedValue([]);
  mocks.members.mockResolvedValue([]);
});

const load = (page?: string) => ExplorePage({ searchParams: Promise.resolve({ q: '  robot  ', page }) });

async function resolveServerSections(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveServerSections));
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node;
  if (typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') {
    const component = node.type as (props: object) => Promise<React.ReactNode>;
    return resolveServerSections(await component(node.props));
  }
  if (node.props.children === undefined) return node;
  const children = await resolveServerSections(node.props.children);
  return Array.isArray(children)
    ? React.cloneElement(node, {}, ...children)
    : React.cloneElement(node, {}, children);
}

describe('search pagination', () => {
  it('returns the home shell with two viewport-deferred sections without starting their queries', async () => {
    mocks.findMany.mockReturnValue(new Promise(() => {}));
    mocks.members.mockReturnValue(new Promise(() => {}));
    const page = await HomePage({ searchParams: Promise.resolve({}) });
    const boundaries: React.ReactElement[] = [];
    function visit(node: React.ReactNode) {
      React.Children.forEach(node, child => {
        if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return;
        if (child.type === HomeFeaturedSection || child.type === HomeMembersSection) boundaries.push(child);
        visit(child.props.children);
      });
    }
    visit(page);
    expect(boundaries).toHaveLength(2);
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.members).not.toHaveBeenCalled();
  });
  it('prioritizes pins and fills three homepage slots with recent public publications', async () => {
    await loadHomeFeatured(new AbortController().signal);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 3,
    }));
  });
  it('allows authenticated homepage visitors to see internal publications', async () => {
    mocks.session = { user: { id: 'member' } };
    await loadHomeFeatured(new AbortController().signal);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED' },
    }));
  });
  it('fetches ten results on page two with matching count and visibility filters', async () => {
    await load('2');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    const where = mocks.findMany.mock.calls[0][0].where;
    expect(where).toEqual(mocks.count.mock.calls[0][0].where);
    expect(where).toMatchObject({ status: 'PUBLISHED', visibility: 'PUBLIC' });
    expect(where.OR).toContainEqual({ title: { contains: 'robot', mode: 'insensitive' } });
  });
  it.each(['-1', 'abc', '2.5', 'Infinity', undefined])('defaults invalid page %s to one', async page => {
    await load(page);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
  });
  it('clamps requests to the last page', async () => {
    await load('999');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20 }));
  });
  it('renders an empty state without pagination when nothing matches', async () => {
    mocks.count.mockResolvedValue(0);
    const html = renderToStaticMarkup(await load('999'));
    expect(html).toContain('Không tìm thấy công trình phù hợp');
    expect(html).not.toContain('aria-label="Phân trang kho công trình"');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
  });
  it('allows signed-in users to search internal publications', async () => {
    mocks.session = { user: { id: 'member' } };
    await load();
    expect(mocks.findMany.mock.calls[0][0].where).not.toHaveProperty('visibility');
  });
  it('preserves Unicode keywords and reserved characters in page links', () => {
    const q = 'robot & thị giác';
    const html = renderToStaticMarkup(<MemberPagination page={2} totalPages={3} basePath={`/?q=${encodeURIComponent(q)}`} />);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://example.test'));
    expect(hrefs.every(url => url.searchParams.get('q') === q)).toBe(true);
    expect(hrefs.some(url => url.searchParams.get('page') === '3')).toBe(true);
    expect(hrefs.some(url => !url.searchParams.has('page'))).toBe(true);
    expect(html).toContain('aria-current="page"');
  });
  it('bounds navigation controls and preserves other independently paginated groups', () => {
    const html = renderToStaticMarkup(<MemberPagination page={50} totalPages={10000} basePath="/members?corePage=7&page=3" pageParam="adminPage" />);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://example.test'));
    expect(hrefs.length).toBeLessThanOrEqual(11);
    expect(hrefs.every(url => url.searchParams.get('corePage') === '7' && url.searchParams.get('page') === '3')).toBe(true);
    expect(hrefs.some(url => url.searchParams.get('adminPage') === '51')).toBe(true);
  });
});

it.each([['ADMIN', true], ['MEMBER', false], [undefined, false]])('shows homepage pin switches only for admin (%s)', async (role, visible) => {
    mocks.session = role ? { user: { id: 'member', role: String(role) } } : null;
    mocks.findMany.mockResolvedValue([{
      id: 'item-1', slug: 'robot', title: 'Robot', summary: 'Tóm tắt', type: 'PROJECT',
      status: 'PUBLISHED', visibility: 'PUBLIC', isPinned: true, publishedYear: 2026,
      contributors: [], links: [], attachments: [],
    }]);
    const tree = await loadHomeFeatured(new AbortController().signal);
    const html = renderToStaticMarkup(await resolveServerSections(tree));
    expect(html.includes('role="switch"')).toBe(visible);
    if (visible) {
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('Ghim trang chủ: Robot');
      expect(html).toContain('Công khai: Robot');
      expect(html.match(/role="switch"/g)).toHaveLength(1);
      expect(html).toContain('aria-pressed="true"');
    }
  });
