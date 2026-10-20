import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role?: string } },
  category: vi.fn(), count: vi.fn(), findMany: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { category: { findUnique: mocks.category }, showcaseItem: { count: mocks.count, findMany: mocks.findMany } } }));
vi.mock('@/actions/showcase-actions', () => ({ replacePinnedShowcaseItemAction: vi.fn(), togglePinShowcaseItemAction: vi.fn(), toggleItemVisibilityAction: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: () => mocks.session }));
vi.mock('@/components/navbar', () => ({ Navbar: () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }), notFound: () => { throw new Error('404'); }, redirect: () => { throw new Error('redirect'); } }));
import CategoryPageShell from '@/app/category/[slug]/page';

// Resolve server components under Suspense before checking completed data markup.
async function resolveServerChildren(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(React.Children.toArray(node).map(resolveServerChildren));
  }
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node;
  if (typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') {
    return resolveServerChildren(await (node.type as (props: unknown) => Promise<React.ReactNode>)(node.props));
  }
  if (node.props.children !== undefined) {
    return React.cloneElement(node, {}, await resolveServerChildren(node.props.children));
  }
  return node;
}

async function CategoryPage(props: Parameters<typeof CategoryPageShell>[0]) {
  return resolveServerChildren(await CategoryPageShell(props));
}

it('returns the stable page shell before loading the results', async () => {
  const shell = await CategoryPageShell({ params: Promise.resolve({ slug: 'robotics-iot' }), searchParams: Promise.resolve({}) });
  expect(mocks.count).not.toHaveBeenCalled();
  expect(mocks.findMany).not.toHaveBeenCalled();
  expect(React.isValidElement(shell)).toBe(true);
  await resolveServerChildren(shell);
  expect(mocks.findMany).toHaveBeenCalledOnce();
});

beforeEach(() => {
  vi.stubGlobal('React', React);
  vi.clearAllMocks();
  mocks.session = null;
  mocks.category.mockResolvedValue({ id: 'category-1', name: 'Research' });
  mocks.count.mockResolvedValue(25);
  mocks.findMany.mockResolvedValue([]);
});

const load = (slug: string, page?: string) => CategoryPage({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({ page }) });

describe('server-side category pagination', () => {
  it('selects ten research items on page two and preserves the public boundary', async () => {
    await load('bai-bao-khoa-hoc', '2');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10, take: 10,
      where: { categoryId: 'category-1', status: 'PUBLISHED', visibility: 'PUBLIC' },
    }));
    expect(mocks.count.mock.calls[0][0].where).toEqual(mocks.findMany.mock.calls[0][0].where);
  });
  it('selects nine robotics items per page', async () => {
    await load('robotics-iot', '2');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 9, take: 9 }));
  });
  it.each(['-1', 'abc', '2.5', 'Infinity'])('normalizes invalid page %s', async page => {
    await load('robotics-iot', page);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
  });
  it('clamps pages beyond the last page', async () => {
    await load('bai-bao-khoa-hoc', '999');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20 }));
  });
  it('allows authorized users to see internal publications', async () => {
    mocks.session = { user: { id: 'member' } };
    await load('robotics-iot');
    expect(mocks.findMany.mock.calls[0][0].where).not.toHaveProperty('visibility');
  });
});

describe('category search and filters', () => {
  it.each(['bai-bao-khoa-hoc', 'robotics-iot'])('combines keyword and year within %s', async slug => {
    await CategoryPage({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({ q: '  robot  ', year: '2026', sort: 'newest', page: '2' }) });
    const args = mocks.findMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ categoryId: 'category-1', status: 'PUBLISHED', visibility: 'PUBLIC', publishedYear: 2026 });
    expect(args.where.OR).toContainEqual({ title: { contains: 'robot', mode: 'insensitive' } });
    expect(args.where.OR).toContainEqual({ summary: { contains: 'robot', mode: 'insensitive' } });
    expect(args.where.OR.some((condition: object) => 'tags' in condition)).toBe(false);
    expect(args.where).toEqual(mocks.count.mock.calls[0][0].where);
    expect(args.orderBy).toEqual([{ publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }]);
    expect(args.skip).toBe(slug === 'robotics-iot' ? 9 : 10);
  });
  it('ignores invalid years and sort options', async () => {
    await CategoryPage({ params: Promise.resolve({ slug: 'robotics-iot' }), searchParams: Promise.resolve({ year: 'oops', sort: 'invalid' }) });
    const args = mocks.findMany.mock.calls[0][0];
    expect(args.where).not.toHaveProperty('publishedYear');
    expect(args.orderBy[0]).toEqual({ isPinned: 'desc' });
  });
  it.each([
    ['oldest', { publishedYear: 'asc' }],
    ['title', { title: 'asc' }],
  ])('supports %s ordering', async (sort, firstOrder) => {
    await CategoryPage({ params: Promise.resolve({ slug: 'robotics-iot' }), searchParams: Promise.resolve({ sort: String(sort) }) });
    expect(mocks.findMany.mock.calls[0][0].orderBy[0]).toEqual(firstOrder);
  });
});

 it('preserves filters in pagination links and displays an accessible form', async () => {
    const result = await CategoryPage({ params: Promise.resolve({ slug: 'robotics-iot' }), searchParams: Promise.resolve({ q: 'robot & IoT', year: '2026', sort: 'title', page: '2' }) });
    const html = renderToStaticMarkup(result);
    expect(html).toContain('aria-label="Tìm kiếm và lọc công trình"');
    const urls = [...html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://example.test'));
    const nextPage = urls.find(url => url.searchParams.get('page') === '3');
    expect(nextPage?.searchParams.get('q')).toBe('robot & IoT');
    expect(nextPage?.searchParams.get('year')).toBe('2026');
    expect(nextPage?.searchParams.get('sort')).toBe('title');
  });

it.each([['bai-bao-khoa-hoc', 'ADMIN', true], ['robotics-iot', 'ADMIN', true], ['bai-bao-khoa-hoc', 'MEMBER', false], ['robotics-iot', undefined, false]])('shows card pin switches for %s and role %s', async (slug, role, visible) => {
    mocks.session = role ? { user: { id: 'member', role: String(role) } } : null;
    mocks.findMany.mockResolvedValue([{
      id: 'item-1', slug: 'robot', title: 'Robot', summary: 'Tóm tắt', type: 'PROJECT',
      status: 'PUBLISHED', visibility: 'PUBLIC', isPinned: true, publishedYear: 2026,
      contributors: [], links: [], attachments: [],
    }]);
    const tree = await CategoryPage({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) });
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
