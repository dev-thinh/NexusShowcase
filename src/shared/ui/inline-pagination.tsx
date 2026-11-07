'use client';
import { z } from 'zod';
import { ValidatedForm } from './validated-form';
import { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/shared/i18n/provider';
import { paginationControlClass } from './member-pagination';

export function InlinePagination({ page, totalPages, disabled, onPageChange }: { page: number; totalPages: number; disabled?: boolean; onPageChange: (page: number) => void }) {
  const { t: tr } = useI18n();
  const id = useId();
  const schema = z.object({ page: z.coerce.number().int('Số trang không hợp lệ.').min(1, 'Số trang không hợp lệ.').max(totalPages, 'Số trang không hợp lệ.') });
  const control = `${paginationControlClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100`;
  return <nav aria-label={tr('Phân trang thành viên')} className="flex items-center gap-2">
    <button type="button" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} aria-label={tr('Trang trước')} className={control}><ChevronLeft size={16} aria-hidden="true" /></button>
    <ValidatedForm schema={schema} key={page} onSubmit={event => { event.preventDefault(); const value = Number(new FormData(event.currentTarget).get('page')); if (Number.isInteger(value) && value >= 1 && value <= totalPages && !disabled && value !== page) onPageChange(value); }} className="flex items-center gap-1.5">
      <label htmlFor={id} className="sr-only">{tr('Trang cần đến')}</label>
      <input id={id} name="page" type="number" min={1} max={totalPages} step={1} required defaultValue={page} disabled={disabled || totalPages <= 1} inputMode="numeric" enterKeyHint="go" className="h-11 w-14 rounded-lg border border-slate-200 bg-white px-1 text-center text-sm font-semibold tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#153D67] disabled:bg-slate-100 disabled:text-slate-400 sm:h-9" />
      <span className="text-xs tabular-nums text-slate-500">/ {totalPages}</span>
    </ValidatedForm>
    <button type="button" disabled={disabled || page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={tr('Trang sau')} className={control}><ChevronRight size={16} aria-hidden="true" /></button>
  </nav>;
}
