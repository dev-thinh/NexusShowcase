
'use client';

import { useI18n } from '@/shared/i18n/provider';
import { Skeleton } from './skeleton';

export function SubmissionWorkspaceLoading() {
  const { t: tr } = useI18n();

  return <section data-submission-workspace-loading role="status" aria-busy="true" aria-label={tr("Đang mở trình soạn thảo")} className="panel-detail w-full !p-0">
    <span className="sr-only">{tr("Đang chuẩn bị trình soạn thảo, vui lòng chờ.")}</span>
    <div aria-hidden="true" className="border-b border-slate-200 px-4 py-4 sm:px-8"><Skeleton className="h-5 w-44" /></div>
    <div aria-hidden="true" className="grid lg:grid-cols-[minmax(0,7fr)_minmax(18rem,4fr)] lg:divide-x lg:divide-slate-200">
      <div className="space-y-6 p-4 sm:p-8"><Skeleton className="h-7 w-48" />{[0, 1].map(i => <div key={i} className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-4/5" /><Skeleton className={i ? 'h-32 w-full' : 'h-11 w-full'} /></div>)}<div className="grid grid-cols-2 gap-4"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div></div>
      <div className="space-y-6 p-4 sm:p-8"><Skeleton className="h-7 w-48" /><Skeleton className="h-20 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-6 w-36" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>
    </div>
    <div aria-hidden="true" className="space-y-5 border-t border-slate-200 p-4 sm:p-8"><Skeleton className="h-7 w-48" /><Skeleton className="h-48 w-full" /></div>
    <div aria-hidden="true" className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-4 sm:px-8"><Skeleton className="mr-auto h-5 w-20" /><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-24" /></div>
  </section>;
}

export function SubmissionWorkspacePageLoading() {
  const { t: tr } = useI18n();

  return <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <div aria-hidden="true" className="mb-6 flex gap-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-36" /></div>
    <header className="mb-8 border-b border-slate-200 pb-5"><Skeleton className="mb-2 h-3 w-36" /><h1 className="page-title">{tr("Soạn thảo công trình")}</h1><Skeleton className="mt-3 h-4 w-3/4" /></header>
    <SubmissionWorkspaceLoading />
  </main>;
}
