'use client';

import { useI18n } from '@/shared/i18n/provider';
import { useId, type ReactNode } from 'react';

export function SubmissionField({ name, errors = {}, children, className = '' }: { name: string; errors?: Record<string, string[]>; children: ReactNode; className?: string }) {
  const { t: tr } = useI18n();
  const id = useId();
  const messages = errors[name] ?? [];
  return <div className={className} role="group" aria-invalid={messages.length ? true : undefined} aria-describedby={messages.length ? id : undefined} data-field-error={messages.length ? name : undefined} tabIndex={messages.length ? -1 : undefined}>
    {children}
    {messages.length > 0 && <p id={id} role="alert" className="mt-1.5 text-sm text-red-700">{messages.map(message => tr(message)).join(' ')}</p>}
  </div>;
}

export function focusFirstSubmissionError(form: HTMLFormElement | null) {
  const field = form?.querySelector<HTMLElement>('[data-field-error], [aria-invalid="true"]:not(input[type="file"])');
  if (!field) return;
  const control = field.matches('input, textarea, button, [role="combobox"]') ? field : field.querySelector<HTMLElement>('input:not([type="file"]):not([type="hidden"]), textarea, [role="combobox"], button:not(:disabled)') ?? field;
  control.focus({ preventScroll: true });
  control.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
