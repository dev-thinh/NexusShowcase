'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { createDialogController, type DialogOptions, type DialogRequest } from '@/lib/dialog-controller';

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
  const confirm = useCallback((options: DialogOptions) => controller.open({ ...options, mode: 'confirm' }), [controller]);
  const alert = useCallback(async (options: DialogOptions) => { await controller.open({ ...options, mode: 'alert' }); }, [controller]);
  const api = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return <DialogContext.Provider value={api}>
    {children}
    {request && createPortal(<Modal isOpen title={request.title} description={request.message} onClose={() => controller.settle(false)}>
      <div className="flex flex-wrap justify-center gap-3">
        {request.mode === 'confirm' && <button type="button" className="action-secondary-detail min-h-11" onClick={() => controller.settle(false)}>{request.cancelLabel ?? 'Hủy'}</button>}
        <button type="button" className={request.destructive
          ? 'inline-flex min-h-11 items-center justify-center rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2'
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
