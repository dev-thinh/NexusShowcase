'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Pin, Globe } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { searchBulkPostsAction, saveBulkPostStatesAction } from '@/actions/bulk-post-actions';
import { type BulkPostEntry, type BulkPostFilter, type BulkPostCounts } from '@/lib/bulk-posts';

export function AdminBulkPosts({ mode }: { mode: 'pin' | 'visibility' }) {
  const isPinMode = mode === 'pin';
  const title = isPinMode ? 'Quản lý ghim' : 'Phạm vi hiển thị';
  const filters: Array<{ value: BulkPostFilter; label: string }> = isPinMode
    ? [{ value: 'PINNED', label: 'Đang ghim' }, { value: 'UNPINNED', label: 'Chưa ghim' }, { value: 'ALL', label: 'Tất cả' }]
    : [{ value: 'PUBLIC', label: 'Công khai' }, { value: 'PRIVATE', label: 'Nội bộ' }, { value: 'ALL', label: 'Tất cả' }];
  const [filter, setFilter] = useState<BulkPostFilter>(isPinMode ? 'PINNED' : 'PUBLIC');
  const [counts, setCounts] = useState<BulkPostCounts | null>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<BulkPostEntry[]>([]);
  const [changes, setChanges] = useState<Record<string, { title: string; enabled: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);
  const [replacement, setReplacement] = useState<{ required: number; items: Array<{ id: string; title: string }> } | null>(null);
  const [replaceIds, setReplaceIds] = useState<string[]>([]);
  const busyRef = useRef(false);
  const allCheckbox = useRef<HTMLInputElement>(null);
  const ids = Object.keys(changes);
  const initialState = (item: BulkPostEntry) => isPinMode ? item.isPinned : item.visibility === 'PUBLIC';
  const desiredState = (item: BulkPostEntry) => changes[item.id]?.enabled ?? initialState(item);
  const checkedOnPage = items.filter(desiredState).length;
  const tooManyPins = isPinMode && Object.values(changes).filter(change => change.enabled).length > 3;
  const allChecked = items.length > 0 && checkedOnPage === items.length;

  useEffect(() => {
    if (allCheckbox.current) allCheckbox.current.indeterminate = checkedOnPage > 0 && !allChecked;
  }, [checkedOnPage, allChecked, open, loading]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const result = await searchBulkPostsAction({ query, page, filter });
        if (cancelled) return;
        if (!result.success) { setItems([]); setError(result.error); return; }
        setCounts(result.counts); setItems(result.items); setTotal(result.total); setPages(result.totalPages);
        if (result.page !== page) setPage(result.page);
      } catch { if (!cancelled) { setItems([]); setError('Không tải được danh sách. Vui lòng thử lại.'); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, query, page, reload, filter]);

  const clearReplacement = () => { setReplacement(null); setReplaceIds([]); setError(''); };
  const close = () => { if (!busyRef.current) { setOpen(false); setChanges({}); clearReplacement(); } };
  const setDesiredState = (current: typeof changes, item: BulkPostEntry, enabled: boolean) => {
    const next = { ...current };
    if (enabled === initialState(item)) delete next[item.id];
    else if (item.id in next || Object.keys(next).length < 50) next[item.id] = { title: item.title, enabled };
    return next;
  };
  const toggle = (item: BulkPostEntry) => {
    clearReplacement(); setSuccess('');
    setChanges(current => setDesiredState(current, item, !(current[item.id]?.enabled ?? initialState(item))));
  };
  const apply = async () => {
    if (busyRef.current || !ids.length) return;
    busyRef.current = true;
    try {
      setBusy(true); setError(''); setSuccess('');
      const result = await saveBulkPostStatesAction({ mode,
        changes: ids.map(itemId => ({ itemId, enabled: changes[itemId].enabled })),
        replaceItemIds: replaceIds,
      });
      if (!result.success) {
        setError(result.error);
        if (result.pinnedItems && result.requiredReplacements) {
          setReplacement({ required: result.requiredReplacements, items: result.pinnedItems });
          setReplaceIds(current => current.filter(id => result.pinnedItems!.some(item => item.id === id)));
        } else { setReplacement(null); setReplaceIds([]); }
        return;
      }
      setChanges({}); clearReplacement(); setLoading(true); setReload(value => value + 1);
      router.refresh();
      setSuccess(`Đã lưu thay đổi cho ${result.count} bài.`);
    } catch { setError('Không kết nối được. Vui lòng thử lại.'); }
    finally { busyRef.current = false; setBusy(false); }
  };

  return <>
    <button type="button" className="action-secondary-detail" onClick={() => { setOpen(true); setLoading(true); setFilter(isPinMode ? 'PINNED' : 'PUBLIC'); setCounts(null); setSuccess(''); setSearch(''); setQuery(''); setPage(1); setReload(value => value + 1); }}>
      {isPinMode ? <Pin aria-hidden="true" className="h-4 w-4" /> : <Globe aria-hidden="true" className="h-4 w-4" />}{title}
    </button>
    {open && createPortal(<Modal isOpen onClose={close} title={title} description={isPinMode ? 'Tick là ghim trang chủ, bỏ tick là không ghim. Chỉnh các bài rồi bấm Áp dụng thay đổi. Tối đa 3 bài ghim.' : 'Tick là công khai, bỏ tick là nội bộ. Chỉnh các bài rồi bấm Áp dụng thay đổi.'} className="!max-w-3xl">
      <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-60">
        <div role="group" aria-label={isPinMode ? 'Lọc trạng thái ghim' : 'Lọc phạm vi hiển thị'} className="flex flex-wrap gap-2">
          {filters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => {
            if (filter === option.value) return;
            setLoading(true); setFilter(option.value); setPage(1); clearReplacement();
          }} className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] ${filter === option.value ? 'border-[#0F294A] bg-brand-button text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {option.label}<span className="rounded bg-black/5 px-1.5 text-xs tabular-nums">{counts?.[option.value] ?? '…'}</span>
          </button>)}
        </div>
        <form onSubmit={event => { event.preventDefault(); setLoading(true); clearReplacement(); setQuery(search.trim()); setPage(1); setReload(value => value + 1); }} className="flex flex-wrap gap-2">
          <input type="search" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} aria-label="Tìm bài đăng để quản lý" placeholder="Tìm theo tiêu đề…" className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm text-left" />
          <button type="submit" disabled={loading} className="action-secondary-detail min-h-11">Tìm kiếm</button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2"><input ref={allCheckbox} type="checkbox" checked={allChecked} disabled={loading || !items.length} onChange={() => {
            clearReplacement();
            setChanges(current => {
              let next = current;
              for (const item of items) next = setDesiredState(next, item, !allChecked);
              return next;
            });
          }} className="h-4 w-4 accent-[#0F294A]" />{isPinMode ? 'Ghim toàn bộ trang này' : 'Công khai toàn bộ trang này'}</label>
          <span role="status" className="text-xs text-slate-500">{ids.length} thay đổi chưa lưu / tối đa 50 bài</span>
          {ids.length > 0 && <button type="button" onClick={() => { setChanges({}); clearReplacement(); }} className="min-h-10 text-xs font-semibold text-primary hover:underline">Hoàn tác thay đổi</button>}
        </div>
        <div aria-busy={loading} className="max-h-[35dvh] overflow-y-auto rounded-md border border-slate-200 text-left">
          {loading ? <div role="status" aria-label="Đang tải bài đăng" className="space-y-4 p-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            : !items.length ? <p className="p-6 text-center text-sm text-slate-500">{query ? 'Không tìm thấy bài phù hợp trong nhóm này.' : filter === 'PINNED' ? 'Chưa có bài đang ghim. Chuyển sang “Chưa ghim” để chọn bài.' : filter === 'UNPINNED' ? 'Tất cả bài đã được ghim.' : filter === 'PUBLIC' ? 'Chưa có bài công khai. Chuyển sang “Nội bộ” để chọn bài.' : filter === 'PRIVATE' ? 'Không có bài nội bộ.' : 'Chưa có bài đã xuất bản.'}</p>
            : items.map(item => <label key={item.id} className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 p-3 last:border-0 ${item.id in changes ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
              <input type="checkbox" checked={desiredState(item)} disabled={!(item.id in changes) && ids.length >= 50} onChange={() => toggle(item)} aria-label={`${isPinMode ? 'Ghim trang chủ' : 'Công khai'}: ${item.title}`} className="mt-1 h-4 w-4 shrink-0 accent-[#0F294A]" />
              <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold leading-6 text-slate-900">{item.title}</span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-md border px-2 py-0.5 font-semibold ${item.isPinned ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{item.isPinned ? 'Đang ghim' : 'Chưa ghim'}</span>
                  <span className={`rounded-md border px-2 py-0.5 font-semibold ${item.visibility === 'PUBLIC' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{item.visibility === 'PUBLIC' ? 'Công khai' : 'Nội bộ'}</span>
                  {item.publishedYear && <span className="text-slate-500">{item.publishedYear}</span>}
                  {item.id in changes && <span className="font-semibold text-amber-800">{isPinMode ? changes[item.id].enabled ? 'Sẽ ghim' : 'Sẽ bỏ ghim' : changes[item.id].enabled ? 'Sẽ công khai' : 'Sẽ chuyển nội bộ'}</span>}
                </span>
              </span>
            </label>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>{total} bài · Trang {page}/{pages}</span><div className="flex gap-2"><button type="button" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)} className="action-secondary-card disabled:opacity-40">Trang trước</button><button type="button" disabled={loading || page >= pages} onClick={() => setPage(value => value + 1)} className="action-secondary-card disabled:opacity-40">Trang sau</button></div>
        </div>

        {replacement && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-left">
          <p className="mb-2 text-sm font-semibold text-amber-900">Chọn ít nhất {replacement.required} bài đang ghim để thay thế</p>
          {replacement.items.map(item => <label key={item.id} className="flex min-h-10 cursor-pointer items-start gap-2 py-2 text-sm"><input type="checkbox" checked={replaceIds.includes(item.id)} onChange={() => setReplaceIds(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])} className="mt-1 h-4 w-4 shrink-0 accent-[#0F294A]" /><span className="break-words">{item.title}</span></label>)}
        </div>}
        {tooManyPins && <p role="alert" className="text-sm text-rose-700">Chọn tối đa 3 bài để ghim.</p>}
        {success && <p role="status" className="text-sm text-emerald-800">{success}</p>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="modal-footer"><button type="button" disabled={busy} onClick={close} className="action-secondary-detail min-h-11">Đóng</button><button type="button" disabled={busy || loading || !ids.length || tooManyPins || !!replacement && replaceIds.length < replacement.required} onClick={() => void apply()} className="action-primary-detail min-h-11 disabled:opacity-50">{busy ? 'Đang lưu…' : `Áp dụng thay đổi (${ids.length})`}</button></div>
      </fieldset>
    </Modal>, document.body)}
  </>;
}
