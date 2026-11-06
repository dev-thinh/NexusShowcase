'use client';

import { useI18n } from '@/shared/i18n/provider';

import { SelectionRowsSkeleton } from '@/shared/ui/content-skeletons';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, KeyRound, Search, Trash2, UserCheck, UserMinus, UserPlus, UserX, X } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { SearchForm } from '@/shared/ui/validated-form';
import { InlinePagination } from '@/shared/ui/inline-pagination';
import { BulkPasswordResults, type PasswordResetCredential } from './bulk-password-results';
import { useCredentialNavigationGuard } from './use-credential-navigation-guard';
import { MAX_MEMBER_GRANTS, type EligibleMember } from '../model/bulk-members';
import { searchGrantMembersAction, grantBulkMembersAction, revokeBulkMembersAction, searchRevokeMembersAction } from '../server/bulk-member-actions';
import { manageMemberAccountsAction, resetBulkMemberPasswordsAction, searchLifecycleMembersAction } from '../server/member-lifecycle-actions';
import { notifySuccess } from '@/shared/dialogs/success';

const bulkModes = [
  { value: 'GRANT', label: 'Cấp quyền', icon: UserPlus },
  { value: 'REVOKE', label: 'Thu hồi quyền', icon: UserMinus },
  { value: 'RESET', label: 'Đặt lại mật khẩu', icon: KeyRound },
  { value: 'DISABLE', label: 'Vô hiệu hóa', icon: UserX },
  { value: 'DELETE', label: 'Xóa vĩnh viễn', icon: Trash2 },
] as const;

export function AdminGrantMembersModal() {
  const { t: tr } = useI18n();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'GRANT' | 'REVOKE' | 'DISABLE' | 'DELETE' | 'RESET'>('GRANT');
  const [confirmation, setConfirmation] = useState('');
  const [showSelected, setShowSelected] = useState(false);
  const selectedId = useId();
  const [credentials, setCredentials] = useState<PasswordResetCredential[]>([]);
  const [downloaded, setDownloaded] = useState(false);
  const [discard, setDiscard] = useState(false);
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
        const result = await (mode === 'GRANT' ? searchGrantMembersAction({ query, page }) : mode === 'REVOKE' ? searchRevokeMembersAction({ query, page }) : searchLifecycleMembersAction({ query, page, operation: mode }));
        if (cancelled) return;
        if (!result.success) { setError(result.error); return; }
        setItems(result.data.items); setTotal(result.data.total); setPages(result.data.totalPages);
        if (result.data.page !== page) setPage(result.data.page);
      } catch { if (!cancelled) setError('Không tải được thành viên. Vui lòng thử tải lại.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, query, page, reload, mode]);

  const finish = () => { setOpen(false); setSelected({}); setConfirming(false); setShowSelected(false); setCredentials([]); setDiscard(false); router.refresh(); };
  const close = () => { if (!locked.current) { if (credentials.length && !downloaded) setDiscard(true); else finish(); } };
  useCredentialNavigationGuard(open && (mode === 'RESET' && busy || credentials.length > 0 && !downloaded), () => {
    if (locked.current) setError('Đang đặt lại mật khẩu. Vui lòng chờ kết quả trước khi rời trang.');
    else setDiscard(true);
  });
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
    if (locked.current || loading || !selection.length || !confirming || needsReload || mode === 'DELETE' && confirmation !== 'DELETE') return;
    locked.current = true; setBusy(true); setError('');
    try {
      const members = selection.map(member => ({ id: member.id, expectedVersion: member.sessionVersion }));
      if (mode === 'RESET') {
        const result = await resetBulkMemberPasswordsAction({ members });
        if (!result.success) { setError(result.error); setNeedsReload(true); return; }
        setCredentials(result.data.credentials); setSelected({}); setConfirming(false); router.refresh();
        return;
      }
      const result = await (mode === 'GRANT' ? grantBulkMembersAction({ members }) : mode === 'REVOKE' ? revokeBulkMembersAction({ members }) : manageMemberAccountsAction({ operation: mode, members }));
      if (!result.success) { setError(result.error); setNeedsReload(true); return; }
      setOpen(false); setSelected({}); setConfirming(false); router.refresh();
      await notifySuccess(mode === 'GRANT' ? "Đã cấp quyền đăng bài cho {0} thành viên." : mode === 'REVOKE' ? "Đã thu hồi quyền đăng bài của {0} thành viên." : mode === 'DISABLE' ? "Đã vô hiệu hóa {0} tài khoản." : "Đã xóa vĩnh viễn {0} tài khoản.", result.data.ids.length);
    } catch {
      setNeedsReload(true);
      setError('Chưa xác định được kết quả. Tải lại danh sách để kiểm tra trước khi chọn tiếp.');
    } finally { locked.current = false; setBusy(false); }
  }

  return <>
    <button type="button" className="action-secondary-detail" onClick={() => {
      setMode('GRANT'); setConfirmation(''); setShowSelected(false); setCredentials([]); setDownloaded(false); setDiscard(false); setSearch(''); setQuery(''); setPage(1); setSelected({}); setError(''); setNeedsReload(false); setConfirming(false); setLoading(true); setReload(value => value + 1); setOpen(true);
    }}><UserCheck aria-hidden="true" className="h-4 w-4" />{tr("Quản lý hàng loạt")}</button>
    <Modal isOpen={open} onClose={close} closeDisabled={busy} title={tr("Quản lý tài khoản hàng loạt")} description={tr("Tối đa 50 thành viên.")} className="!max-w-2xl">
      {credentials.length > 0 ? <>
        <BulkPasswordResults credentials={credentials} onDownloaded={() => { setDownloaded(true); setDiscard(false); }} />
        {discard && <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm"><p>{tr("Chưa tải mật khẩu tạm. Đóng mà không lưu?")}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="action-secondary-detail" onClick={() => setDiscard(false)}>{tr("Quay lại")}</button><button type="button" className="action-secondary-detail" onClick={finish}>{tr("Đóng và bỏ mật khẩu tạm")}</button></div></div>}
        <div className="modal-footer"><button type="button" className="action-secondary-detail" onClick={close}>{tr("Đóng")}</button></div>
      </> : <fieldset disabled={busy} className="min-w-0 space-y-3 text-left disabled:opacity-60">
        {!confirming && <>
          <div role="group" aria-label={tr("Chọn thao tác hàng loạt")} className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {bulkModes.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={mode === value} className={`inline-flex min-h-10 flex-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] ${mode === value ? 'bg-white text-[#153D67] shadow-sm' : 'text-slate-600 hover:bg-white/60'}`} onClick={() => {
              if (mode === value) return;
              setMode(value); setShowSelected(false); setSelected({}); setConfirmation(''); setError(''); setNeedsReload(false); setPage(1); setLoading(true);
            }}><Icon size={14} className="shrink-0" aria-hidden="true" /><span className="min-w-0">{tr(label)}</span></button>)}
          </div>
          <SearchForm onSubmit={event => { event.preventDefault(); setError(''); setLoading(true); setQuery(search.trim()); setPage(1); setReload(value => value + 1); }} className="flex min-w-0 flex-wrap gap-2">
            <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="search" name="q" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} aria-label={tr("Tìm tài khoản để quản lý")} placeholder={tr("Tìm họ tên hoặc tên đăng nhập…")} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 pl-10 pr-3 text-sm" /></div>
            <button type="submit" disabled={loading} className="action-secondary-detail min-h-11">{tr("Tìm kiếm")}</button>
          </SearchForm>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="inline-flex min-h-11 items-center gap-2"><input ref={allCheckbox} type="checkbox" checked={allChecked} disabled={loading || needsReload || !items.length || !allChecked && selection.length + items.length - checked > MAX_MEMBER_GRANTS} onChange={() => setSelected(current => {
              const next = { ...current };
              for (const item of items) { if (allChecked) delete next[item.id]; else next[item.id] = item; }
              return next;
            })} className="h-4 w-4 accent-[#153D67]" />{tr("Chọn cả trang này")}</label>
            <span role="status" className="text-xs text-slate-500">{selection.length}/{MAX_MEMBER_GRANTS} {tr("đã chọn")}</span>
          </div>
          <div aria-busy={loading} className="max-h-[35dvh] overflow-y-auto rounded-lg border border-slate-200">
            {loading ? <SelectionRowsSkeleton members /> : !items.length ? <p className="p-5 text-sm text-slate-500">{tr("Không có tài khoản phù hợp với thao tác này.")}</p> : items.map(item => <label key={item.id} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-0">
              <input type="checkbox" checked={!!selected[item.id]} disabled={needsReload || !selected[item.id] && selection.length >= MAX_MEMBER_GRANTS} aria-label={tr("Chọn {0}", item.fullName)} onChange={() => toggle(item)} className="h-4 w-4 shrink-0 accent-[#153D67]" />
              <span className="min-w-0"><span className="block break-words text-sm font-semibold">{item.fullName}</span><span className="block break-all text-xs text-slate-500">{item.email}</span></span>
            </label>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span>{total}{tr(" thành viên · Trang ")}{page}/{pages}</span><InlinePagination page={page} totalPages={pages} disabled={loading || needsReload} onPageChange={value => { setLoading(true); setPage(value); }} /></div>
          {selection.length > 0 && <button type="button" aria-expanded={showSelected} aria-controls={selectedId} onClick={() => setShowSelected(value => !value)} className="flex min-h-10 w-full items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#153D67] hover:bg-slate-50">{tr("Xem {0} thành viên đã chọn", selection.length)}<ChevronDown size={16} aria-hidden="true" className={showSelected ? 'rotate-180' : ''} /></button>}
        </>}
        {selection.length > 0 && (confirming || showSelected) && <section id={selectedId} aria-label={tr("Thành viên đã chọn")} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">{confirming ? tr("Xác nhận danh sách tài khoản") : tr("Thành viên đã chọn")} ({selection.length})</h4>{!confirming && <button type="button" className="min-h-11 text-xs underline" onClick={() => setSelected({})}>{tr("Bỏ chọn tất cả")}</button>}</div>
          {confirming && <p className="mb-3 text-sm leading-6">{mode === 'REVOKE' ? tr("Những người dưới đây sẽ trở lại vai trò Thành viên và không còn quyền đăng bài. Các bài đã đăng vẫn được giữ lại.") : mode === 'RESET' ? tr("Mỗi tài khoản sẽ nhận mật khẩu tạm riêng, đăng xuất mọi phiên và phải đổi mật khẩu khi đăng nhập lại.") : mode === 'GRANT' ? tr("Những người dưới đây sẽ có quyền đăng bài với vai trò Trưởng nhóm.") : mode === 'DISABLE' ? tr("Các tài khoản được chọn sẽ không thể đăng nhập. Bài đăng vẫn được giữ lại và có thể khôi phục tài khoản sau này.") : tr("Tài khoản sẽ bị xóa vĩnh viễn và không thể khôi phục. Bài đăng được giữ lại; họ tên tác giả chuyển thành người đóng góp ngoài CLB.")}</p>}
          <ul className="max-h-[25dvh] space-y-1 overflow-y-auto">{selection.map(member => <li key={member.id} className="flex min-h-11 items-center justify-between gap-2 text-sm"><span className="min-w-0 break-words">{member.fullName}<span className="block break-all text-xs text-slate-500">{member.email}</span></span>{!confirming && <button type="button" aria-label={tr("Bỏ chọn {0}", member.fullName)} onClick={() => toggle(member)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white"><X aria-hidden="true" className="h-4 w-4" /></button>}</li>)}</ul>
        </section>}
        {confirming && mode === 'DELETE' && <label className="block text-sm">{tr("Nhập DELETE để xác nhận")}<input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3" /></label>}
        {error && <p role="alert" className="text-sm leading-6 text-rose-700">{tr(error)}</p>}
        {(needsReload || error && !confirming) && <button type="button" className="action-secondary-detail min-h-11" onClick={refresh}>{tr("Tải lại danh sách")}</button>}
        <div className="modal-footer">
          <button type="button" className="action-secondary-detail min-h-11" onClick={() => { if (confirming && !needsReload) setConfirming(false); else close(); }}>{confirming && !needsReload ? tr("Quay lại chọn") : tr("Đóng")}</button>
          <button type="button" disabled={busy || loading || !selection.length || needsReload || confirming && mode === 'DELETE' && confirmation !== 'DELETE'} className="action-primary-detail min-h-11 disabled:opacity-50" onClick={() => { if (confirming) void grant(); else setConfirming(true); }}><Check aria-hidden="true" className="h-4 w-4" />{busy ? tr("Đang xử lý…") : confirming ? mode === 'GRANT' ? tr("Xác nhận cấp quyền ({0})", selection.length) : tr("Xác nhận ({0})", selection.length) : tr("Xem lại {0} thành viên", selection.length)}</button>
        </div>
      </fieldset>}
    </Modal>
  </>;
}
