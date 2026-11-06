'use client';
import { useI18n } from '@/shared/i18n/provider';


import { useId } from 'react';
import { z } from 'zod';
import { FieldError, ValidatedForm } from '@/shared/ui/validated-form';

export function PaginationJump({ page, totalPages, basePath, pageParam, className }: { page: number; totalPages: number; basePath: string; pageParam: string; className: string }) {
  const { t: tr } = useI18n();

  const id = useId();
  const [pathname, query] = basePath.split('?');
  const params = new URLSearchParams(query);
  params.delete(pageParam);
  const message = `Nhập số trang từ 1 đến ${totalPages}.`;
  const schema = z.object({ [pageParam]: z.coerce.number().int(message).min(1, message).max(totalPages, message) });
  return <div className={className}>
    <ValidatedForm key={`${basePath}-${page}`} schema={schema} action={pathname} navigation scroll={false} prefetch={false} inlineErrors className="grid grid-cols-[auto_auto] items-center justify-center gap-1.5" aria-label={tr("Chọn trang")}>
      {[...params.entries()].map(([name, value], index) => <input key={`${name}-${index}`} type="hidden" name={name} value={value} />)}
      <label className="sr-only" htmlFor={id}>{tr("Trang cần đến")}</label>
      <input id={id} type="number" name={pageParam} min={1} max={totalPages} step={1} required defaultValue={page} inputMode="numeric" enterKeyHint="go" aria-describedby={`${id}-hint`} className="h-11 w-14 rounded-lg border border-slate-200 bg-white px-1 text-center text-sm font-semibold tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#153D67] sm:h-9" />
      <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">/ {totalPages}</span>
      <span id={`${id}-hint`} className="sr-only">{tr("Nhấn Enter hoặc Go để chuyển trang.")}</span>
      <div className="col-span-full text-center empty:hidden"><FieldError name={pageParam} /></div>
    </ValidatedForm>
  </div>;
}
