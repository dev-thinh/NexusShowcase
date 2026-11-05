import { Skeleton } from './skeleton';
import { Loader2 } from 'lucide-react';

export function SubmissionWorkspaceLoading() {
  return <section data-submission-workspace-loading aria-busy="true" aria-label="Đang mở trình soạn thảo" className="panel-detail w-full !p-0">
    <p role="status" className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 text-sm sm:px-8"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />Đang chuẩn bị trình soạn thảo…</p>
    <div aria-hidden="true" className="grid gap-8 p-4 sm:p-8 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,4fr)]">
      <div className="space-y-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-11 w-full" /><Skeleton className="h-20 w-32" /><Skeleton className="h-32 w-full" /><Skeleton className="h-11 w-full" /></div>
      <div className="space-y-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-6 w-36" /><Skeleton className="h-11 w-full" /></div>
    </div>
  </section>;
}

export function SubmissionWorkspacePageLoading() {
  return <main className="container mx-auto max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <h1 className="page-title">Soạn thảo công trình</h1>
    <SubmissionWorkspaceLoading />
  </main>;
}
