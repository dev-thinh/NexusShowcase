'use client';

import { X } from 'lucide-react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const openDialogs: symbol[] = [];
let savedBodyOverflow = '';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closeDisabled?: boolean;
}

export function Modal({ isOpen, onClose, title, description, children, className = '', closeDisabled = false }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  closeDisabledRef.current = closeDisabled;
  const [present, setPresent] = useState(isOpen);
  const visible = isOpen || present;
  const live = useRef(false);
  const closing = useRef(false);
  const generation = useRef(0);
  const exitAnimations = useRef<Animation[]>([]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const exit = useCallback((notify: boolean) => {
    if (closing.current || !live.current) return;
    closing.current = true;
    const request = ++generation.current;
    const complete = () => {
      if (!live.current || generation.current !== request) return;
      closing.current = false;
      setPresent(false);
      if (notify) onCloseRef.current();
    };
    const panel = dialogRef.current;
    const overlay = overlayRef.current;
    if (!panel || !overlay || typeof panel.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      complete();
      return;
    }
    overlay.dataset.closing = 'true';
    const panelStyle = getComputedStyle(panel);
    exitAnimations.current = [
      panel.animate([
        { opacity: panelStyle.opacity, transform: panelStyle.transform },
        { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
      ], { duration: 150, easing: 'ease-in', fill: 'forwards' }),
      overlay.animate([{ opacity: getComputedStyle(overlay).opacity }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' }),
    ];
    void Promise.all(exitAnimations.current.map(animation => animation.finished.catch(() => {}))).then(complete);
  }, []);
  const requestClose = useCallback(() => { if (!closeDisabledRef.current) exit(true); }, [exit]);

  // Focus and scroll belong to the open/close lifecycle, not callback updates.
  useEffect(() => {
    const token = Symbol('dialog');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (openDialogs.at(-1) !== token) return;
      if (e.key === 'Escape') { e.preventDefault(); requestClose(); }
      if (e.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]');
        const first = controls?.[0];
        const last = controls?.[controls.length - 1];
        if (!first || !last) { e.preventDefault(); return; }
        const outside = !dialogRef.current?.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current || outside)) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current || outside)) {
          e.preventDefault(); first.focus();
        }
      }
    };
    if (visible) {
      live.current = true;
      const previousFocus = document.activeElement as HTMLElement | null;
      if (!openDialogs.length) savedBodyOverflow = document.body.style.overflow;
      openDialogs.push(token);
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      dialogRef.current?.focus({ preventScroll: true });
      return () => {
        live.current = false;
        generation.current++;
        closing.current = false;
        exitAnimations.current.forEach(animation => animation.cancel());
        exitAnimations.current = [];
        const wasTop = openDialogs.at(-1) === token;
        const index = openDialogs.indexOf(token);
        if (index >= 0) openDialogs.splice(index, 1);
        if (!openDialogs.length) document.body.style.overflow = savedBodyOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        if (wasTop && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      };
    }
  }, [visible, requestClose]);

  useEffect(() => {
    if (isOpen) {
      generation.current++;
      closing.current = false;
      exitAnimations.current.forEach(animation => animation.cancel());
      exitAnimations.current = [];
      if (overlayRef.current) delete overlayRef.current.dataset.closing;
      setPresent(true);
    } else if (present) exit(false);
  }, [isOpen, present, exit]);

  if (!visible || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={overlayRef} data-modal-overlay onMouseDown={(event) => event.target === event.currentTarget && requestClose()} className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`modal-panel bg-white w-full max-w-lg rounded-lg border border-slate-200 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="modal-header">
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-base sm:text-lg font-semibold text-[#1F2937]">
              {title}
            </h3>
            {description && <p id={descriptionId} className="text-sm text-[#1F2937] mt-2 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            disabled={closeDisabled}
            onClick={requestClose}
            className="absolute right-3 top-3 p-1.5 rounded-lg text-[#1F2937] hover:text-[#1F2937] hover:bg-[#FFFFFF] transition-colors cursor-pointer ml-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/20"
            aria-label="Đóng hộp thoại"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>, document.body,
  );
}
