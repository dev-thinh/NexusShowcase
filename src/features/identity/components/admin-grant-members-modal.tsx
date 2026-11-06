'use client';

import { useI18n } from '@/shared/i18n/provider';

import { SelectionRowsSkeleton } from '@/shared/ui/content-skeletons';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Search, UserCheck, X } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { SearchForm } from '@/shared/ui/validated-form';
import { MAX_MEMBER_GRANTS, type EligibleMember } from '../model/bulk-members';
import { searchGrantMembersAction, grantBulkMembersAction } from '../server/bulk-member-actions';
import { notifySuccess } from '@/shared/dialogs/success';

export function AdminGrantMembersModal() {
  const { t: tr } = useI18n();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<EligibleMember[]>([]);
  const [selected, setSelected] = useState<Record<string, EligibleMember>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const allCheckbox = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [needsReload, setNeedsReload] = useState(false);
  const [reload, setReload] = useState(0);
  const selection = Object.values(selected);
  const checked = items.filter(item => selected[item.id]).length;
  const allChecked = !!items.length && checked === items.length;

  useEffect(() => {
    if (allCheckbox.current) allCheckbox.current.indeterminate = checked > 0 && !allChecked;
  }, [checked, allChecked, confirming, loading]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setItems([]);
    void (async () => {
      try {
        const result = await searchGrantMembersAction({ query, page });
        if (cancelled) return;
        if (!result.success) { setError(result.error); return; }
        setItems(result.data.items); setTotal(result.data.total); setPages(result.data.totalPages);
        if (result.data.page !== page) setPage(result.data.page);
      } catch { if (!cancelled) setError('Không tải được thành viên. Vui lòng thử tải lại.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, query, page, reload]);

  const close = () => { if (!locked.current) { setOpen(false); setSelected({}); setConfirming(false); } };
  const toggle = (item: EligibleMember) => setSelected(current => {
    const next = { ...current };
    if (next[item.id]) delete next[item.id];
    else if (Object.keys(next).length < MAX_MEMBER_GRANTS) next[item.id] = item;
    return next;
  });
  const refresh = () => {
    if (locked.current) return;
    setSelected({}); setConfirming(false); setNeedsReload(false); setError(''); setLoading(true); setPage(1); setReload(value => value + 1);
  };
  async function grant() {
    if (locked.current || loading || !selection.length || !confirming || needsReload) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = await grantBulkMembersAction({ members: selection.map(member => ({ id: member.id, expectedVersion: member.sessionVersion })) });
      if (!result.success) { setError(result.error); setNeedsReload(true); return; }
      setOpen(false); setSelected({}); setConfirming(false); router.refresh();
      await notifySuccess("Đã cấp quyền đăng bài cho {0} thành viên.", result.data.ids.length);
    } catch {
      setNeedsReload(true);
      setError('Chưa xác định được kết quả cấp quyền. Tải lại danh sách để kiểm tra trước khi chọn tiếp.');
    } finally { locked.current = false; setBusy(false); }
  }

  return <>
    <button type="button" className="action-secondary-detail" onClick={() => {
      setSearch(''); setQuery(''); setPage(1); setSelected({}); setError(''); setNeedsReload(false); setConfirming(false); setLoading(true); setReload(value => value + 1); setOpen(true);
    }}><UserCheck aria-hidden="true" className="h-4 w-4" />{tr("Cấp quyền hàng loạt")}</button>
    <Modal isOpen={open} onClose={close} closeDisabled={busy} title={tr("Cấp quyền đăng bài hàng loạt")} description={tr("Tối đa 50 thành viên.")} className="!max-w-3xl">
      <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-60">
        {!confirming && <>
          <SearchForm onSubmit={event => { event.preventDefault(); setError(''); setLoading(true); setQuery(search.trim()); setPage(1); setReload(value => value + 1); }} className="flex min-w-0 flex-wrap gap-2">
            <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="search" name="q" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} aria-label={tr("Tìm thành viên để cấp quyền")} placeholder={tr("Tìm họ tên hoặc tên đăng nhập…")} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 pl-10 pr-3 text-sm" /></div>
            <button type="submit" disabled={loading} className="action-secondary-detail min-h-11">{tr("Tìm kiếm")}</button>
          </SearchForm>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="inline-flex min-h-11 items-center gap-2"><input ref={allCheckbox} type="checkbox" checked={allChecked} disabled={loading || needsReload || !items.length || !allChecked && selection.length + items.length - checked > MAX_MEMBER_GRANTS} onChange={() => setSelected(current => {
              const next = { ...current };
              for (const item of items) { if (allChecked) delete next[item.id]; else next[item.id] = item; }
              return next;
            })} className="h-4 w-4 accent-[#153D67]" />{tr("Chọn cả trang này")}</label>
            <span role="status" className="text-xs text-slate-600">{tr("Đã chọn ")}{selection.length}/{MAX_MEMBER_GRANTS}{tr(" người")}</span>
          </div>
          <div aria-busy={loading} className="max-h-[35dvh] overflow-y-auto rounded-lg border border-slate-200">
            {loading ? <SelectionRowsSkeleton members /> : !items.length ? <p className="p-5 text-sm text-slate-500">{tr("Không có thành viên phù hợp để cấp quyền.")}</p> : items.map(item => <label key={item.id} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-0">
              <input type="checkbox" checked={!!selected[item.id]} disabled={needsReload || !selected[item.id] && selection.length >= MAX_MEMBER_GRANTS} aria-label={tr("Chọn {0}", item.fullName)} onChange={() => toggle(item)} className="h-4 w-4 shrink-0 accent-[#153D67]" />
              <span className="min-w-0"><span className="block break-words text-sm font-semibold">{item.fullName}</span><span className="block break-all text-xs text-slate-500">{item.email}</span></span>
            </label>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600"><span>{total}{tr(" thành viên · Trang ")}{page}/{pages}</span><div className="flex gap-2"><button type="button" disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage(value => value - 1); }} className="action-secondary-detail min-h-11">{tr("Trang trước")}</button><button type="button" disabled={loading || page >= pages} onClick={() => { setLoading(true); setPage(value => value + 1); }} className="action-secondary-detail min-h-11">{tr("Trang sau")}</button></div></div>
        </>}
        {selection.length > 0 && <section aria-label={tr("Thành viên đã chọn")} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">{confirming ? tr("Xác nhận danh sách cấp quyền") : tr("Thành viên đã chọn")} ({selection.length})</h4>{!confirming && <button type="button" className="min-h-11 text-xs underline" onClick={() => setSelected({})}>{tr("Bỏ chọn tất cả")}</button>}</div>
          {confirming && <p className="mb-3 text-sm leading-6">{tr("Những người dưới đây sẽ có quyền đăng bài với vai trò Trưởng nhóm.")}</p>}
          <ul className="max-h-[25dvh] space-y-1 overflow-y-auto">{selection.map(member => <li key={member.id} className="flex min-h-11 items-center justify-between gap-2 text-sm"><span className="min-w-0 break-words">{member.fullName}<span className="block break-all text-xs text-slate-500">{member.email}</span></span>{!confirming && <button type="button" aria-label={tr("Bỏ chọn {0}", member.fullName)} onClick={() => toggle(member)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white"><X aria-hidden="true" className="h-4 w-4" /></button>}</li>)}</ul>
        </section>}
        {error && <p role="alert" className="text-sm leading-6 text-rose-700">{tr(error)}</p>}
        {(needsReload || error && !confirming) && <button type="button" className="action-secondary-detail min-h-11" onClick={refresh}>{tr("Tải lại danh sách")}</button>}
        <div className="modal-footer">
          <button type="button" className="action-secondary-detail min-h-11" onClick={() => { if (confirming && !needsReload) setConfirming(false); else close(); }}>{confirming && !needsReload ? tr("Quay lại chọn") : tr("Đóng")}</button>
          <button type="button" disabled={busy || loading || !selection.length || needsReload} className="action-primary-detail min-h-11 disabled:opacity-50" onClick={() => { if (confirming) void grant(); else setConfirming(true); }}><Check aria-hidden="true" className="h-4 w-4" />{busy ? tr("Đang cấp quyền…") : confirming ? tr("Xác nhận cấp quyền ({0})", selection.length) : tr("Xem lại {0} thành viên", selection.length)}</button>
        </div>
      </fieldset>
    </Modal>
  </>;
}
