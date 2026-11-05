'use client';

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, Pencil, Save, X } from 'lucide-react';
import { NavigationLink } from '@/shared/navigation/navigation-link';
import { defaultHomeText, homeContentSchema, homeTextLabel, homeTextLimit, type HomeContent, type HomeContentPayload, type HomeText, type HomeTextKey } from '../model/home-content';
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
    <textarea ref={input} data-home-field={field} aria-label={homeTextLabel(field)} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${id}-error` : undefined} rows={1} required maxLength={homeTextLimit(field)} disabled={busy} value={text[field]} onChange={event => change(field, event.target.value)} className="home-inline-input" />
    {errors[field] && <span id={`${id}-error`} role="alert" className="block rounded bg-white px-2 py-1 text-sm font-normal tracking-normal text-red-700">{errors[field]}</span>}
  </span>;
}

/** Action labels remain editable without nesting form controls inside links. */
export function HomeContentLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const { editing } = useContext(HomeEditingContext);
  return editing ? <div data-home-content-link className={className}>{children}</div> : <NavigationLink href={href} className={className}>{children}</NavigationLink>;
}

export function HomeContentProvider({ children, initialContent }: { children: ReactNode; initialContent: HomeContentPayload }) {
  const editButton = useRef<HTMLButtonElement>(null);
  const [content, setContent] = useState<HomeContentPayload>(initialContent);
  const [draft, setDraft] = useState<HomeText>(initialContent.text);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Partial<Record<HomeTextKey, string>>>({});
  const [conflict, setConflict] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'discard' | 'reload' | null>(null);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(content.text);

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

  async function openEditor() {
    setBusy(true);
    setNotice('');
    try {
      const latest = await fetchHomeContent();
      if (!latest.isAdmin) throw new Error('Bạn không còn quyền chỉnh sửa. Vui lòng kiểm tra lại phiên đăng nhập.');
      setContent(latest);
      setDraft(latest.text);
      setErrors({});
      setConflict(false);
      setConfirmAction(null);
      setEditing(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không mở được chỉnh sửa. Vui lòng thử lại.'); }
    finally { setBusy(false); }
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
    const parsed = homeContentSchema.safeParse({ version: content.version, text: draft });
    setNotice('');
    setErrors({});
    if (!parsed.success) {
      const next: Partial<Record<HomeTextKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[1] as HomeTextKey;
        if (field in defaultHomeText) next[field] = `Vui lòng nhập nội dung (tối đa ${homeTextLimit(field)} ký tự).`;
      }
      setErrors(next);
      document.querySelector<HTMLTextAreaElement>(`[data-home-field="${Object.keys(next)[0]}"]`)?.focus();
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
      setContent(latest); setDraft(latest.text); setErrors({}); setConflict(false); setConfirmAction(null); setNotice('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không tải được bản mới.'); }
    finally { setBusy(false); }
  }

  return <HomeTextContext.Provider value={editing ? draft : content.text}>
    <HomeEditingContext.Provider value={{ editing, busy, errors, change: (field, value) => {
      setDraft(current => ({ ...current, [field]: value }));
      setErrors(current => ({ ...current, [field]: undefined }));
    } }}>
      {children}
      {content.isAdmin && <div role="region" aria-label="Chỉnh sửa nội dung Trang chủ" className={`home-content-toolbar fixed bottom-5 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:right-6 ${editing ? 'rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg' : ''}`}>
        {notice && <p role={notice === 'Đã cập nhật nội dung Trang chủ.' ? 'status' : 'alert'} className={`max-w-sm text-sm ${editing ? '' : 'rounded-lg border bg-white p-3 text-slate-700 shadow'}`}>{notice}</p>}
        {editing ? <>
          {conflict && <button type="button" disabled={busy} className="min-h-11 text-sm underline" onClick={() => setConfirmAction('reload')}>Tải bản mới nhất</button>}
          {confirmAction && <div className="max-w-sm text-sm">
            <p>{confirmAction === 'discard' ? 'Bỏ các thay đổi chưa lưu?' : 'Thay bản đang nhập bằng nội dung mới nhất?'}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} className="min-h-11 font-semibold underline disabled:opacity-50" onClick={() => { if (busy) return; if (confirmAction === 'reload') void reload(); else finishEditing(); }}>{confirmAction === 'discard' ? 'Bỏ thay đổi' : 'Đồng ý tải lại'}</button>
              <button type="button" disabled={busy} className="min-h-11 underline" onClick={() => setConfirmAction(null)}>Tiếp tục sửa</button>
            </div>
          </div>}
          <div className="flex items-center gap-2">
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50" onClick={() => { if (dirty) setConfirmAction('discard'); else finishEditing(); }}><X size={16} aria-hidden="true" />Hủy</button>
            <button type="button" disabled={busy || !dirty || conflict} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} {busy ? 'Đang xử lý…' : 'Lưu nội dung'}</button>
          </div>
        </> : <button ref={editButton} type="button" aria-label="Chỉnh sửa nội dung" title="Chỉnh sửa nội dung" onClick={() => void openEditor()} disabled={busy} className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-slate-900 sm:h-auto sm:w-auto sm:px-5 sm:py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-700 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}<span className="hidden sm:inline">Chỉnh sửa nội dung</span>
        </button>}
      </div>}
    </HomeEditingContext.Provider>
  </HomeTextContext.Provider>;
}
