'use client';

import { useFormStatus } from 'react-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { NavigationLink } from '@/shared/navigation/navigation-link';
import { useI18n } from '@/shared/i18n/provider';

export function FilterActions({ resetHref, active, className = '' }: { resetHref: string; active: boolean; className?: string }) {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  if (!active && !pending) return null;
  return <div className={`filter-actions flex h-11 items-center justify-end gap-2 ${className}`} aria-busy={pending}>
    {pending && <Loader2 size={18} className="animate-spin text-slate-500" aria-hidden="true" />}
    {active && <NavigationLink href={resetHref} scroll={false} onClick={event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.currentTarget.closest('form')?.reset();
    }} aria-label={t('Xóa bộ lọc')} title={t('Xóa bộ lọc')} className="inline-flex h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]">
      <RotateCcw size={16} aria-hidden="true" /><span className="sr-only xl:not-sr-only">{t('Xóa bộ lọc')}</span>
    </NavigationLink>}
    <span role="status" className="sr-only">{pending ? t('Đang lọc…') : ''}</span>
  </div>;
}
