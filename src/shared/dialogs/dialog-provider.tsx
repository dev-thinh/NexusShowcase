'use client';
import { useI18n } from '@/shared/i18n/provider';


import { createDialogController, type DialogOptions, type DialogRequest } from '@/shared/dialogs/controller';
import { Modal } from '@/shared/ui/modal';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SUCCESS_EVENT, type SuccessRequest } from './success';
import { CheckCircle2, X } from 'lucide-react';

type DialogApi = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
};
const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t: tr } = useI18n();

  const [notices, setNotices] = useState<Array<{ id: number; message: string; values?: unknown[] }>>([]);
  const noticeId = useRef(0);
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const controllerRef = useRef<ReturnType<typeof createDialogController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createDialogController(setRequest);
  const controller = controllerRef.current;
  const pathname = usePathname();
  useEffect(() => () => controller.cancelAll(), [controller, pathname]);
  useEffect(() => {
    const success = (event: Event) => {
      event.preventDefault();
      const { message, values, resolve } = (event as CustomEvent<SuccessRequest>).detail;
      const id = ++noticeId.current;
      setNotices(current => [...current.slice(-2), { id, message, values }]);
      resolve();
    };
    window.addEventListener(SUCCESS_EVENT, success);
    return () => window.removeEventListener(SUCCESS_EVENT, success);
  }, []);
  useEffect(() => {
    if (!notices.length) return;
    const timer = setTimeout(() => setNotices(current => current.slice(1)), 8000);
    return () => clearTimeout(timer);
  }, [notices]);
  const confirm = useCallback((options: DialogOptions) => controller.open({ ...options, mode: 'confirm' }), [controller]);
  const alert = useCallback(async (options: DialogOptions) => { await controller.open({ ...options, mode: 'alert' }); }, [controller]);
  const api = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return <DialogContext.Provider value={api}>
    {children}
    {notices.length > 0 && createPortal(<div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:max-w-md" aria-live="polite" aria-relevant="additions">
      {notices.map(notice => <div key={notice.id} role="status" data-success-notice="true" data-success-id={notice.id} className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-slate-700 shadow-lg">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <p className="min-w-0 flex-1 break-words leading-6">{tr(notice.message, ...(notice.values ?? []))}</p>
        <button type="button" aria-label={tr("Đóng thông báo thành công")} className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]" onClick={() => setNotices(current => current.filter(item => item.id !== notice.id))}><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>)}
    </div>, document.body)}
    {request && createPortal(<Modal isOpen title={tr(request.title)} description={tr(request.message)} onClose={() => controller.settle(false)} className="!rounded-2xl">
      <div className="flex flex-wrap justify-center gap-3">
        {request.mode === 'confirm' && <button type="button" className="action-secondary-detail min-h-11" onClick={() => controller.settle(false)}>{tr(request.cancelLabel ?? "Hủy")}</button>}
        <button type="button" className={request.destructive
          ? 'inline-flex min-h-11 items-center justify-center rounded-lg bg-[#153D67] px-4 text-sm font-semibold text-white hover:bg-[#153D67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2'
          : 'action-primary-detail min-h-11'} onClick={() => controller.settle(true)}>
          {tr(request.confirmLabel ?? (request.mode === 'alert' ? 'Đóng' : 'Xác nhận'))}
        </button>
      </div>
    </Modal>, document.body)}
  </DialogContext.Provider>;
}

export function useDialog() {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error('useDialog requires DialogProvider');
  return dialog;
}
