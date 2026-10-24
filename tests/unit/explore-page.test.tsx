import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExplorePage from '@/app/(shell)/(site)/explore/page';

const mocks = vi.hoisted(() => ({ session: vi.fn(), list: vi.fn() }));
vi.mock('@/features/identity/server/session', () => ({ getSession: mocks.session }));
vi.mock('@/features/publications/server/queries', () => ({ listPublications: mocks.list }));
vi.mock('@/features/publications/components/card-admin-controls', () => ({ CardAdminControls: () => null }));
vi.mock('@/features/publications/components/citation-modal', () => ({ CitationModal: () => 'Trích dẫn khoa học' }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.list.mockResolvedValue({ items: [], total: 0, totalPages: 1, page: 1 });
});

describe('publication library', () => {
  it('opens the entire library without requiring a keyword', async () => {
    const html = renderToStaticMarkup(await ExplorePage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('Khám phá các bài nghiên cứu và dự án của CLB Robotics &amp; IoT.</h1>');
    expect(html.match(/Khám phá các bài nghiên cứu và dự án/g)).toHaveLength(1);
    expect(html).toContain('Khám phá các bài nghiên cứu và dự án của CLB Robotics &amp; IoT.');
    expect(html).toContain('Tất cả công trình');
    expect(html).toContain('Chưa có công trình nào');
    expect(html).not.toContain('Kết quả tìm kiếm</h1>');
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ authenticated: false, q: '', pageSize: 10 }));
  });

  it('keeps its title while searching and clearing returns to the library', async () => {
    const html = renderToStaticMarkup(await ExplorePage({ searchParams: Promise.resolve({ q: '  robot  ' }) }));
    expect(html).toContain('Khám phá các bài nghiên cứu và dự án của CLB Robotics &amp; IoT.</h1>');
    expect(html).toContain('0 công trình cho “robot”');
    expect(html).toContain('Không tìm thấy công trình phù hợp');
    expect(html).toContain('action="/explore"');
    expect(html).toContain('href="/explore"');
    expect(html).toContain('Xóa bộ lọc');
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ q: 'robot' }));
  });

  it('keeps filters, pagination and the detail return URL together', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'member', role: 'MEMBER' } });
    mocks.list.mockResolvedValue({ items: [{
      id: 'p1', slug: 'robot', title: 'Robot', summary: 'Tóm tắt', type: 'PROJECT',
      status: 'PUBLISHED', visibility: 'PUBLIC', isPinned: false, publishedYear: 2026,
      contributors: [], links: [], attachments: [],
    }], total: 25, totalPages: 3, page: 2 });
    const html = renderToStaticMarkup(await ExplorePage({ searchParams: Promise.resolve({ q: 'robot & thị giác', year: '2026', sort: 'title', page: '2' }) }));
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ authenticated: true, year: 2026, sort: 'title', page: '2' }));
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://test.local'));
    const next = hrefs.find(url => url.pathname === '/explore' && url.searchParams.get('page') === '3');
    expect(next?.searchParams.get('q')).toBe('robot & thị giác');
    expect(next?.searchParams.get('year')).toBe('2026');
    expect(next?.searchParams.get('sort')).toBe('title');
    const detail = hrefs.find(url => url.pathname === '/showcase/robot');
    const source = new URL(detail!.searchParams.get('returnTo')!, 'https://test.local');
    expect(source.pathname).toBe('/explore');
    expect(source.searchParams.get('page')).toBe('2');
    expect(source.searchParams.get('q')).toBe('robot & thị giác');
  });

  it('normalizes invalid filters before querying', async () => {
    await ExplorePage({ searchParams: Promise.resolve({ year: 'garbage', sort: 'invalid' }) });
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ year: undefined, sort: 'newest' }));
  });

  it.each(['RESEARCH_PAPER', 'PROJECT'])('shows relevant actions for %s in the shared horizontal layout', async type => {
    mocks.list.mockResolvedValue({ items: [{
      id: 'p1', slug: 'work', title: 'Công trình', summary: 'Tóm tắt', type,
      status: 'PUBLISHED', visibility: 'PUBLIC', isPinned: false, publishedYear: 2026,
      contributors: [], attachments: [], links: [
        { type: 'PAPER_URL', url: 'https://example.com/paper' },
        { type: 'GITHUB', url: 'https://github.com/example/robot' },
        { type: 'LIVE_DEMO', url: 'https://example.com/demo' },
      ],
    }], total: 1, totalPages: 1, page: 1 });
    const html = renderToStaticMarkup(await ExplorePage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('sm:grid-cols-[11rem_minmax(0,1fr)]');
    expect(html).toContain('Xem công trình');
    if (type === 'RESEARCH_PAPER') {
      expect(html).toContain('Trích dẫn khoa học');
      expect(html).toContain('Bài báo gốc');
      expect(html).not.toContain('href="https://example.com/demo"');
    } else {
      expect(html).toContain('href="https://github.com/example/robot"');
      expect(html).toContain('href="https://example.com/demo"');
      expect(html).not.toContain('Trích dẫn khoa học');
      expect(html).not.toContain('Bài báo gốc');
    }
  });
});
