'use client';
import type { Locale } from '@/shared/i18n/core';
import { useI18n } from '@/shared/i18n/provider';


import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2, Pencil, Save, X } from 'lucide-react';
import { NavigationLink } from '@/shared/navigation/navigation-link';
import { defaultHomeText, homeContentSchema, homeTextLabel, homeTextLimit, type HomeContent, type HomeContentPayload, type HomeTextKey } from '../model/home-content';
import { fetchHomeContent } from '../model/home-content-request';

type EditingContext = {
  editing: boolean;
  busy: boolean;
  errors: Partial<Record<HomeTextKey, string>>;
  change: (field: HomeTextKey, value: string) => void;
};
const HomeTextContext = createContext(defaultHomeText);
const HomeEditingContext = createContext<EditingContext>({ editing: false, busy: false, errors: {}, change: () => {} });
export const useHomeText = () => useContext(HomeTextContext);

export function HomeText({ field, children }: { field: HomeTextKey; children?: ReactNode }) {
  const { t: tr } = useI18n();

  const text = useHomeText();
  const { editing, busy, errors, change } = useContext(HomeEditingContext);
  const input = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!editing || !input.current) return;
    const control = input.current;
    const resize = () => { control.style.height = 'auto'; control.style.height = `${control.scrollHeight + 2}px`; };
    resize();
    const observer = new ResizeObserver(() => {
      if (control.clientWidth !== width) { width = control.clientWidth; resize(); }
    });
    let width = control.clientWidth;
    observer.observe(control);
    return () => observer.disconnect();
  }, [editing, text[field]]);
  if (!editing) return <span className="whitespace-pre-line [overflow-wrap:anywhere]">{text[field] ?? children}</span>;
  return <span className="home-inline-field">
    <textarea ref={input} data-home-field={field} aria-label={tr(homeTextLabel(field))} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${id}-error` : undefined} rows={1} required maxLength={homeTextLimit(field)} disabled={busy} value={text[field]} onChange={event => change(field, event.target.value)} className="home-inline-input" />
    {errors[field] && <span id={`${id}-error`} role="alert" className="block rounded bg-white px-2 py-1 text-sm font-normal tracking-normal text-red-700">{tr(errors[field] ?? '')}</span>}
  </span>;
}

/** Action labels remain editable without nesting form controls inside links. */
export function HomeContentLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const { editing } = useContext(HomeEditingContext);
  return editing ? <div data-home-content-link className={className}>{children}</div> : <NavigationLink href={href} className={className}>{children}</NavigationLink>;
}

export function HomeContentProvider({ children, initialContent }: { children: ReactNode; initialContent: HomeContentPayload }) {
  const { t: tr, locale, setLocale } = useI18n();

  const confirmationId = useId();
  const editButton = useRef<HTMLButtonElement>(null);
  const [content, setContent] = useState<HomeContentPayload>(initialContent);
  const [draft, setDraft] = useState({ vi: initialContent.text, en: initialContent.englishText });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Locale, Partial<Record<HomeTextKey, string>>>>>({});
  const [conflict, setConflict] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'discard' | 'reload' | null>(null);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify({ vi: content.text, en: content.englishText });

  useEffect(() => {
    if (editing || notice !== 'Đã cập nhật nội dung Trang chủ.') return;
    const timeout = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [editing, notice]);

  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  useEffect(() => {
    if (!editing || (!dirty && !busy)) return;
    const guardNavigation = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin || (target.pathname === window.location.pathname && target.search === window.location.search)) return;
      event.preventDefault();
      event.stopPropagation();
      setNotice(busy ? 'Đang xử lý thay đổi. Vui lòng chờ trước khi chuyển trang.' : 'Bạn có thay đổi chưa lưu. Hãy lưu nội dung hoặc chọn Hủy trước khi chuyển trang.');
    };
    document.addEventListener('click', guardNavigation, true);
    return () => document.removeEventListener('click', guardNavigation, true);
  }, [editing, dirty, busy]);

  function openEditor() {
    if (busy || !content.isAdmin) return;
    // The page already contains a complete snapshot. Save checks permissions
    // and its version on the server; explicit reload fetches a newer snapshot.
    setDraft({ vi: content.text, en: content.englishText });
    setNotice('');
    setErrors({});
    setConflict(false);
    setConfirmAction(null);
    setEditing(true);
  }

  function finishEditing(saved?: HomeContent) {
    if (saved) { setContent({ ...saved, isAdmin: true }); setNotice('Đã cập nhật nội dung Trang chủ.'); }
    else setNotice('');
    setEditing(false);
    setConfirmAction(null);
    setErrors({});
    requestAnimationFrame(() => editButton.current?.focus());
  }

  async function save() {
    if (busy || conflict) return;
    const parsed = homeContentSchema.safeParse({ version: content.version, text: draft.vi, englishText: draft.en });
    setNotice('');
    setErrors({});
    if (!parsed.success) {
      const next: Partial<Record<Locale, Partial<Record<HomeTextKey, string>>>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[1] as HomeTextKey;
        if (field in defaultHomeText) {
          const language = issue.path[0] === 'englishText' ? 'en' : 'vi';
          (next[language] ??= {})[field] = tr("Vui lòng nhập nội dung (tối đa {0} ký tự).", homeTextLimit(field));
        }
      }
      setErrors(next);
      const language = Object.keys(next)[0] as Locale;
      setLocale(language);
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(`[data-home-field="${Object.keys(next[language] ?? {})[0]}"]`)?.focus());
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/home/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      if (!response.ok) { setConflict(response.status === 409); throw new Error(result.error || 'Không lưu được nội dung. Vui lòng thử lại.'); }
      finishEditing(homeContentSchema.parse(result));
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không lưu được nội dung. Bản đang nhập vẫn được giữ để thử lại.'); }
    finally { setBusy(false); }
  }

  async function reload() {
    if (busy) return;
    setBusy(true);
    try {
      const latest = await fetchHomeContent();
      if (!latest.isAdmin) throw new Error('Bạn không còn quyền chỉnh sửa.');
      setContent(latest); setDraft({ vi: latest.text, en: latest.englishText }); setErrors({}); setConflict(false); setConfirmAction(null); setNotice('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không tải được bản mới.'); }
    finally { setBusy(false); }
  }

  return <HomeTextContext.Provider value={editing ? draft[locale] : locale === 'en' ? content.englishText : content.text}>
    <HomeEditingContext.Provider value={{ editing, busy, errors: errors[locale] ?? {}, change: (field, value) => {
      setDraft(current => ({ ...current, [locale]: { ...current[locale], [field]: value } }));
      setErrors(current => ({ ...current, [locale]: { ...current[locale], [field]: undefined } }));
    } }}>
      {children}
      {content.isAdmin && <div role="region" aria-label={tr("Chỉnh sửa nội dung Trang chủ")} className={`home-content-toolbar fixed bottom-5 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:right-6 ${editing ? 'rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg' : ''}`}>
        {notice && <p role={notice === 'Đã cập nhật nội dung Trang chủ.' ? 'status' : 'alert'} className={`max-w-sm text-sm ${editing ? '' : 'rounded-lg border bg-white p-3 text-slate-700 shadow'}`}>{tr(notice)}</p>}
        {editing ? <>
          {conflict && !confirmAction && <button type="button" disabled={busy} className="min-h-11 text-sm underline" onClick={() => setConfirmAction('reload')}>{tr("Tải bản mới nhất")}</button>}
          {confirmAction ? <div className="w-[min(22rem,calc(100vw-3rem))] p-2 text-left" role="group" aria-labelledby={confirmationId}>
            <div className="flex items-start gap-3 px-1 pb-4 pt-1">
              <span className="flex w-12 shrink-0 self-stretch items-center justify-center rounded-xl bg-slate-900 text-amber-300"><AlertTriangle size={26} aria-hidden="true" /></span>
              <div className="min-w-0">
                <p id={confirmationId} className="text-sm font-semibold leading-6 text-slate-900">{confirmAction === 'discard' ? tr("Bỏ các thay đổi chưa lưu?") : tr("Thay bản đang nhập bằng nội dung mới nhất?")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{tr("Các thay đổi chưa lưu ở cả VI và EN sẽ bị mất.")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} autoFocus className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:opacity-50" onClick={() => setConfirmAction(null)}>{tr("Tiếp tục sửa")}</button>
              <button type="button" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-50" onClick={() => { if (busy) return; if (confirmAction === 'reload') void reload(); else finishEditing(); }}>{busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{confirmAction === 'discard' ? tr("Bỏ thay đổi") : tr("Đồng ý tải lại")}</button>
            </div>
          </div> :
          <div className="flex items-center gap-2">
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50" onClick={() => { if (dirty) setConfirmAction('discard'); else finishEditing(); }}><X size={16} aria-hidden="true" />{tr("Hủy")}</button>
            <button type="button" disabled={busy || !dirty || conflict} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} {busy ? tr("Đang xử lý…") : tr("Lưu nội dung")}</button>
          </div>}
        </> : <button ref={editButton} type="button" aria-label={tr("Chỉnh sửa nội dung")} title={tr("Chỉnh sửa nội dung")} onClick={openEditor} disabled={busy} className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-slate-900 sm:h-auto sm:w-auto sm:px-5 sm:py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-700 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}<span className="hidden sm:inline">{tr("Chỉnh sửa nội dung")}</span>
        </button>}
      </div>}
    </HomeEditingContext.Provider>
  </HomeTextContext.Provider>;
}
