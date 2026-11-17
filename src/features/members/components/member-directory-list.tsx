'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronsDown, ChevronsUp, Loader2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n/provider';
import type { Page } from '@/shared/lib/pagination';
import { sortMembersByContribution, type MemberDirectoryEntry, type PublicMemberRole } from '../model/directory';
import { HomeMemberWall } from './home-member-wall';
import { MemberCard } from './member-card';

export function MemberDirectoryList({ initialPage, role, cards = false }: { initialPage: Page<MemberDirectoryEntry>; role: PublicMemberRole; cards?: boolean }) {
  const { t: tr } = useI18n();
  const initialCount = initialPage.items.length;
  const [page, setPage] = useState(initialPage);
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const hasBufferedMore = visibleCount < page.items.length;
  const hasRemoteMore = page.page < page.totalPages;
  const hasMore = hasBufferedMore || hasRemoteMore;
  const canCollapse = visibleCount > initialCount;
  const visibleItems = page.items.slice(0, visibleCount);

  const loadMore = useCallback(async () => {
    if (locked.current || !hasMore) return;
    if (page.page >= page.totalPages && visibleCount < page.items.length) {
      setError('');
      setVisibleCount(page.items.length);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    locked.current = true; setLoading(true); setError('');
    let current = page;
    try {
      while (current.page < current.totalPages) {
        const remainingPages = Array.from({ length: current.totalPages - current.page }, (_, index) => current.page + index + 1);
        const results = await Promise.all(remainingPages.map(async nextPage => {
          const response = await fetch(`/api/members?${new URLSearchParams({ role, page: String(nextPage) })}`, { signal: controller.signal, cache: 'no-store' });
          if (!response.ok) throw new Error('Directory request failed');
          const result = await response.json() as Page<MemberDirectoryEntry>;
          if (!Array.isArray(result.items) || !Number.isSafeInteger(result.page) || !Number.isSafeInteger(result.totalPages)) throw new Error('Invalid directory response');
          return result;
        }));
        if (controller.signal.aborted) return;
        const members = new Map(current.items.map(member => [member.id, member]));
        for (const result of results) {
          for (const member of result.items) members.set(member.id, member);
        }
        const last = results.at(-1)!;
        const nextItems = sortMembersByContribution([...members.values()]);
        const progressed = last.page > current.page && nextItems.length > current.items.length;
        current = { ...last, items: nextItems, totalPages: progressed ? last.totalPages : last.page };
        setPage(current);
        setVisibleCount(current.items.length);
      }
    } catch {
      if (!controller.signal.aborted) setError('Không tải được thành viên. Vui lòng thử lại.');
    } finally {
      if (request.current === controller) {
        locked.current = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }, [hasMore, page, role, visibleCount]);

  const collapse = useCallback(() => {
    request.current?.abort();
    request.current = null;
    locked.current = false;
    setLoading(false);
    setError('');
    setVisibleCount(initialCount);
  }, [initialCount]);

  useEffect(() => () => request.current?.abort(), []);

  return <div data-member-directory={role}>
    {cards ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{visibleItems.map(member => <MemberCard key={member.id} member={member} group={role} />)}</div>
      : <HomeMemberWall members={visibleItems} total={visibleItems.length} showMeta={false} limitOnMobile={false} />}
    {(hasMore || canCollapse || error) && <div className="mt-5 flex flex-col items-center gap-3" aria-busy={loading}>
      {error && <p role="alert" className="text-sm text-red-700">{tr(error)}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasMore && <button type="button" disabled={loading} onClick={() => void loadMore()} className="action-secondary-detail min-h-11" data-member-load-more={role}>
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ChevronsDown size={16} aria-hidden="true" />}{loading ? tr('Đang tải…') : error ? tr('Thử lại') : tr('Xem thêm')}
        </button>}
        {canCollapse && <button type="button" onClick={collapse} className="action-secondary-detail min-h-11" data-member-collapse={role}>
          <ChevronsUp size={16} aria-hidden="true" />{tr('Ẩn bớt')}
        </button>}
      </div>
    </div>}
  </div>;
}
