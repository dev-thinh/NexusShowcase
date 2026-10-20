import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role?: string } },
  count: vi.fn(), findMany: vi.fn(), members: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { showcaseItem: { count: mocks.count, findMany: mocks.findMany }, user: { findMany: mocks.members } } }));
vi.mock('@/actions/showcase-actions', () => ({ replacePinnedShowcaseItemAction: vi.fn(), togglePinShowcaseItemAction: vi.fn(), toggleItemVisibilityAction: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: () => mocks.session }));
vi.mock('@/components/navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/academic-footer', () => ({ AcademicFooter: () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import HomePage from '@/app/page';
import { MemberPagination } from '@/components/member-pagination';

beforeEach(() => {
  vi.stubGlobal('React', React);
  vi.clearAllMocks();
  mocks.session = null;
  mocks.count.mockResolvedValue(25);
  mocks.findMany.mockResolvedValue([]);
  mocks.members.mockResolvedValue([]);
});

const load = (page?: string) => HomePage({ searchParams: Promise.resolve({ q: '  robot  ', page }) });

describe('search pagination', () => {
  it('prioritizes pins and fills three homepage slots with recent public publications', async () => {
    await HomePage({ searchParams: Promise.resolve({}) });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 3,
    }));
  });
  it('allows authenticated homepage visitors to see internal publications', async () => {
    mocks.session = { user: { id: 'member' } };
    await HomePage({ searchParams: Promise.resolve({}) });
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
    expect(html).toContain('Không tìm thấy công trình nào');
    expect(html).not.toContain('aria-label="Phân trang kết quả tìm kiếm"');
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
});

it.each([['ADMIN', true], ['MEMBER', false], [undefined, false]])('shows homepage pin switches only for admin (%s)', async (role, visible) => {
    mocks.session = role ? { user: { id: 'member', role: String(role) } } : null;
    mocks.findMany.mockResolvedValue([{
      id: 'item-1', slug: 'robot', title: 'Robot', summary: 'Tóm tắt', type: 'PROJECT',
      status: 'PUBLISHED', visibility: 'PUBLIC', isPinned: true, publishedYear: 2026,
      contributors: [], links: [], attachments: [],
    }]);
    const tree = await HomePage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);
    expect(html.includes('role="switch"')).toBe(visible);
    if (visible) {
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('Ghim trang chủ: Robot');
      expect(html).toContain('Công khai: Robot');
      expect(html.match(/role="switch"/g)).toHaveLength(1);
      expect(html).toContain('aria-pressed="true"');
    }
  });
