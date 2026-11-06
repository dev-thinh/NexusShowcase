'use client';
import { useI18n } from '@/shared/i18n/provider';


import { AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ErrorNotice({ message, id, focus = false, className = '' }: {
  message: string | null | undefined; id?: string; focus?: boolean; className?: string;
}) {
  const { t: tr } = useI18n();

  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!message || !focus) return;
    notice.current?.focus({ preventScroll: true });
    notice.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [message, focus]);
  if (!message) return null;
  return <div ref={notice} id={id} role="alert" aria-atomic="true" tabIndex={focus ? -1 : undefined} className={`error-notice ${className}`}>
    <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
    <p className="min-w-0 break-words font-semibold">{tr(message)}</p>
  </div>;
}
