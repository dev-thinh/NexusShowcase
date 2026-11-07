'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronsDown, Loader2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n/provider';
import type { Page } from '@/shared/lib/pagination';
import { sortMembersByContribution, type MemberDirectoryEntry, type PublicMemberRole } from '../model/directory';
import { HomeMemberWall } from './home-member-wall';
import { MemberCard } from './member-card';

export function MemberDirectoryList({ initialPage, role, cards = false }: { initialPage: Page<MemberDirectoryEntry>; role: PublicMemberRole; cards?: boolean }) {
  const { t: tr } = useI18n();
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sentinel = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const allowAutomatic = useRef(false);
  const hasMore = page.page < page.totalPages;

  const loadMore = useCallback(async (automatic = false) => {
    if (locked.current || !hasMore || automatic && error) return;
    const controller = new AbortController();
    request.current = controller;
    locked.current = true; setLoading(true); setError('');
    try {
      const response = await fetch(`/api/members?${new URLSearchParams({ role, page: String(page.page + 1) })}`, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Directory request failed');
      const result = await response.json() as Page<MemberDirectoryEntry>;
      if (!Array.isArray(result.items) || !Number.isSafeInteger(result.page) || !Number.isSafeInteger(result.totalPages)) throw new Error('Invalid directory response');
      if (controller.signal.aborted) return;
      setPage(current => {
        const members = new Map(current.items.map(member => [member.id, member]));
        for (const member of result.items) members.set(member.id, member);
        const progressed = result.page > current.page && members.size > current.items.length;
        return { ...result, items: sortMembersByContribution([...members.values()]), totalPages: progressed ? result.totalPages : result.page };
      });
    } catch {
      if (!controller.signal.aborted) setError('Không tải được thành viên. Vui lòng thử lại.');
    } finally {
      if (request.current === controller) {
        locked.current = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }, [error, hasMore, page.page, role]);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || typeof IntersectionObserver === 'undefined') return;
    let inView = false;
    let scrollY = window.scrollY;
    const maybeLoad = () => { if (inView && allowAutomatic.current) void loadMore(true); };
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      maybeLoad();
    }, { rootMargin: '0px' });
    const onScroll = () => {
      if (window.scrollY !== scrollY) { allowAutomatic.current = true; scrollY = window.scrollY; }
      maybeLoad();
    };
    observer.observe(target);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [hasMore, loadMore]);

  return <div data-member-directory={role}>
    {cards ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{page.items.map(member => <MemberCard key={member.id} member={member} group={role} />)}</div>
      : <HomeMemberWall members={page.items} total={page.items.length} showMeta={false} limitOnMobile={false} />}
    {(hasMore || error) && <div ref={sentinel} className="mt-5 flex flex-col items-center gap-3" aria-busy={loading}>
      {error && <p role="alert" className="text-sm text-red-700">{tr(error)}</p>}
      {hasMore && <button type="button" disabled={loading} onClick={() => void loadMore()} className="action-secondary-detail min-h-11" data-member-load-more={role}>
        {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ChevronsDown size={16} aria-hidden="true" />}{loading ? tr('Đang tải…') : error ? tr('Thử lại') : tr('Xem thêm')}
      </button>}
    </div>}
  </div>;
}
