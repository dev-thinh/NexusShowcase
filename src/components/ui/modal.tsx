'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const openDialogs: symbol[] = [];
let savedBodyOverflow = '';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className = '' }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus and scroll belong to the open/close lifecycle, not callback updates.
  useEffect(() => {
    const token = Symbol('dialog');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (openDialogs.at(-1) !== token) return;
      if (e.key === 'Escape') onCloseRef.current();
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
    if (isOpen) {
      const previousFocus = document.activeElement as HTMLElement | null;
      if (!openDialogs.length) savedBodyOverflow = document.body.style.overflow;
      openDialogs.push(token);
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      dialogRef.current?.focus();
      return () => {
        const wasTop = openDialogs.at(-1) === token;
        const index = openDialogs.indexOf(token);
        if (index >= 0) openDialogs.splice(index, 1);
        if (!openDialogs.length) document.body.style.overflow = savedBodyOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        if (wasTop && previousFocus?.isConnected) previousFocus.focus();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div onMouseDown={(event) => event.target === event.currentTarget && onClose()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`bg-white w-full max-w-lg rounded-lg border border-slate-200 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in zoom-in-95 duration-150 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="modal-header">
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-base sm:text-lg font-semibold text-slate-900">
              {title}
            </h3>
            {description && <p id={descriptionId} className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/20"
            aria-label="Đóng hộp thoại"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
