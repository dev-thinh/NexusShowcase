'use client';

import { createDialogController, type DialogOptions, type DialogRequest } from '@/shared/dialogs/controller';
import { Modal } from '@/shared/ui/modal';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SUCCESS_EVENT, type SuccessRequest } from './success';
import { SuccessNotice } from './success-notice';

type DialogApi = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
};
const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const controllerRef = useRef<ReturnType<typeof createDialogController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createDialogController(setRequest);
  const controller = controllerRef.current;
  const pathname = usePathname();
  useEffect(() => () => controller.cancelAll(), [controller, pathname]);
  useEffect(() => {
    const success = (event: Event) => {
      event.preventDefault();
      const { message, resolve } = (event as CustomEvent<SuccessRequest>).detail;
      void controller.open({ mode: 'success', title: 'Thành công', message, confirmLabel: 'Đã hiểu' }).then(resolve);
    };
    window.addEventListener(SUCCESS_EVENT, success);
    return () => window.removeEventListener(SUCCESS_EVENT, success);
  }, [controller]);
  const confirm = useCallback((options: DialogOptions) => controller.open({ ...options, mode: 'confirm' }), [controller]);
  const alert = useCallback(async (options: DialogOptions) => { await controller.open({ ...options, mode: 'alert' }); }, [controller]);
  const api = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return <DialogContext.Provider value={api}>
    {children}
    {request && createPortal(<Modal isOpen title={request.title} description={request.mode === 'success' ? undefined : request.message} onClose={() => controller.settle(false)} className="!rounded-2xl">
      {request.mode === 'success' && <SuccessNotice message={request.message} />}
      <div className="flex flex-wrap justify-center gap-3">
        {request.mode === 'confirm' && <button type="button" className="action-secondary-detail min-h-11" onClick={() => controller.settle(false)}>{request.cancelLabel ?? 'Hủy'}</button>}
        <button type="button" className={request.destructive
          ? 'inline-flex min-h-11 items-center justify-center rounded-lg bg-[#153D67] px-4 text-sm font-semibold text-white hover:bg-[#153D67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2'
          : 'action-primary-detail min-h-11'} onClick={() => controller.settle(true)}>
          {request.confirmLabel ?? (request.mode === 'alert' ? 'Đóng' : 'Xác nhận')}
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
