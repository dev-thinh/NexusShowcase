
'use client';

import { useI18n } from '@/shared/i18n/provider';
import type { ReactNode } from 'react';
import { Skeleton } from './skeleton';

/** A single announcement per loading region; the shapes are decorative. */
export function SkeletonRegion({ children, label = 'Đang tải nội dung', className = '', layout }: { children: ReactNode; label?: string; className?: string; layout?: string }) {
  const { t: tr } = useI18n();

  return <div role="status" aria-label={tr(label)} aria-busy="true" data-skeleton-layout={layout} className={className}>
    <span className="sr-only">{tr(label)}{tr(", vui lòng chờ.")}</span>
    <div aria-hidden="true">{children}</div>
  </div>;
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-3">{Array.from({ length: lines }, (_, i) => <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}</div>;
}

export function FiltersSkeleton({ management = false }: { management?: boolean }) {
  return <div className={`mb-6 grid grid-cols-2 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 md:gap-4 ${management ? 'md:grid-cols-[minmax(0,1fr)_14rem_auto]' : 'md:grid-cols-[minmax(0,1fr)_8rem_11rem_auto]'}`} aria-hidden="true" data-skeleton-filters>
    <div className="col-span-2 space-y-2 md:col-span-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-11 w-full" /></div>
    <Skeleton className="h-11 w-full md:hidden" />
    {Array.from({ length: management ? 1 : 2 }, (_, i) => <div key={i} className="hidden space-y-2 md:block"><Skeleton className="h-4 w-16" /><Skeleton className="h-11 w-full" /></div>)}
    <Skeleton className="h-11 w-full md:w-28" />
  </div>;
}

export function PublicationSkeleton({ variant, count = variant === 'projects' ? 6 : 3 }: { variant: 'research' | 'projects' | 'featured'; count?: number }) {
  const { t: tr } = useI18n();

  const project = variant === 'projects';
  const featured = variant === 'featured';
  return <SkeletonRegion layout={variant} label={tr("Đang tải công trình")}>
    <div className={project ? 'grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3' : 'grid items-start gap-4'}>
      {Array.from({ length: count }, (_, i) => <div key={i} className={`publication-card ${featured ? 'home-featured-card' : ''} panel-public min-w-0 overflow-hidden !p-0`}>
        <div className={project ? 'publication-card__content flex min-w-0 flex-col' : featured ? 'publication-card__content grid min-w-0 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]' : 'publication-card__content grid min-w-0 items-stretch gap-5 p-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[16rem_minmax(0,1fr)]'}>
          {project ? <div className="publication-card__media shrink-0 px-5 pt-5 sm:px-6 sm:pt-6"><div className="publication-cover-frame relative aspect-[4/3] overflow-hidden rounded-lg"><Skeleton className="absolute inset-0 h-full w-full" /></div></div>
            : <div className={`publication-card__media relative min-w-0 ${featured ? 'aspect-[4/3] border-b border-slate-200 md:border-b-0 md:border-r' : 'aspect-[4/3] overflow-hidden rounded-lg'}`}>{featured ? <div className="home-featured-image-frame relative"><Skeleton className="absolute inset-0 h-full w-full" /></div> : <Skeleton className="absolute inset-0 h-full w-full" />}</div>}
          <div className={`publication-card__body min-w-0 space-y-2 ${project ? 'p-5 sm:p-6' : featured ? 'px-3 pb-2 pt-3 sm:px-6 sm:pt-5' : ''}`}>
            <div className="flex gap-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-12" /></div>
            <Skeleton className="h-6 w-full sm:h-7" />
            <Skeleton className="h-6 w-3/5" /><div className="h-12 space-y-2 py-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
            <div className="publication-card__footer flex items-center justify-between gap-3 border-t border-slate-200 py-1"><Skeleton className="h-7 w-16" /><Skeleton className="h-7 w-24" /></div>
          </div>
        </div>
      </div>)}
    </div>
  </SkeletonRegion>;
}

export function MemberWallSkeleton({ count = 10, dark = false, meta = false }: { count?: number; dark?: boolean; meta?: boolean }) {
  const { t: tr } = useI18n();

  return <SkeletonRegion label={tr("Đang tải thành viên")} layout="member-wall">
    {meta && <div className="mb-6 flex flex-wrap justify-between gap-4"><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-64 max-w-full" /></div>}
    <div className="home-member-grid">{Array.from({ length: count }, (_, i) => <div key={i} className="home-member-slot">
      <Skeleton className={`!h-[4.25rem] !w-[4.25rem] !rounded-full sm:!h-[4.75rem] sm:!w-[4.75rem] ${dark ? '!bg-slate-500/40' : ''}`} />
    </div>)}</div>
  </SkeletonRegion>;
}

export function MemberDirectorySkeleton() {
  return <div className="space-y-10" data-skeleton-layout="member-directory"><Skeleton className="mb-5 h-5 w-28" />{[4, 6, 12].map((count, i) => <section key={i}>
    <div className="mb-6 border-b border-slate-200 pb-4"><Skeleton className="h-7 w-40" /></div>
    <MemberWallSkeleton count={count} />
  </section>)}</div>;
}

export function MemberCardsSkeleton() {
  const { t: tr } = useI18n();

  return <SkeletonRegion layout="member-cards" label={tr("Đang tải danh bạ")}><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div className="panel-public min-w-0 !p-4 sm:!p-5" key={i}>
    <div className="mb-4 flex gap-4"><Skeleton className="h-14 w-14 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-3"><Skeleton className="h-6 w-4/5" /><Skeleton className="h-5 w-24" /></div></div>
    <TextSkeleton /><div className="mt-5 flex justify-between border-t border-slate-200 pt-4"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-20" /></div>
  </div>)}</div></SkeletonRegion>;
}

export function StatsSkeleton({ personal = false }: { personal?: boolean }) {
  return <div aria-hidden="true" className={`mb-6 grid gap-3 ${personal ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
    {[0, 1, 2].map(i => <div key={i} className="panel-operational !p-3 !shadow-none sm:!p-4"><div className="min-h-[3.75rem] sm:min-h-0"><Skeleton className="h-4 w-3/4" /></div><Skeleton className="mt-3 h-8 w-12" /></div>)}
  </div>;
}

export function ManagementRowsSkeleton({ variant = 'posts', count = 5 }: { variant?: 'posts' | 'members' | 'reviews' | 'activity' | 'portfolio'; count?: number }) {
  const { t: tr } = useI18n();

  if (variant === 'members') return <SkeletonRegion layout="rows-members" label={tr("Đang tải thành viên")}><div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">{Array.from({ length: count }, (_, i) => <div key={i} className="admin-member-row grid min-w-0 gap-2 p-3 sm:p-5">
    <Skeleton className="col-start-1 row-span-2 row-start-1 h-10 w-10 self-center rounded-full" /><Skeleton className="col-start-2 row-start-1 h-5 w-4/5" /><Skeleton className="col-start-3 row-start-1 h-4 w-16 justify-self-end" /><Skeleton className="col-start-2 row-start-2 h-6 w-20" /><Skeleton className="col-start-3 row-start-2 h-7 w-20 justify-self-end" />
  </div>)}</div></SkeletonRegion>;
  return <SkeletonRegion layout={`rows-${variant}`} label={tr("Đang tải danh sách")}>
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {Array.from({ length: count }, (_, i) => <div key={i} className="p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-4">
          {variant !== 'activity' && variant !== 'reviews' && <Skeleton className={variant === 'portfolio' ? 'hidden h-16 w-16 shrink-0 sm:block' : 'hidden h-20 w-28 shrink-0 sm:block'} />}
          <div className="min-w-0 flex-1 space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-4/5" />{variant !== 'activity' && <Skeleton className="h-4 w-3/5" />}</div>
          {variant === 'portfolio' && <Skeleton className="h-4 w-10 shrink-0" />}
        </div>
        {variant !== 'portfolio' && variant !== 'activity' && <div className="mt-3 flex justify-end gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-20" /></div>}
      </div>)}
    </div>
  </SkeletonRegion>;
}

export function ArticleSkeleton({ sidebar = true }: { sidebar?: boolean }) {
  const { t: tr } = useI18n();

  return <SkeletonRegion layout="article" label={tr("Đang tải nội dung công trình")}>
    <div className="border-b border-slate-200 pb-8"><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0 space-y-4"><Skeleton className="h-5 w-32" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-3/4" /><Skeleton className="h-5 w-1/2" /></div>
      <Skeleton className="h-40 w-full max-w-60 rounded-lg" />
    </div></div>
    <div className={`grid items-start gap-10 pt-9 ${sidebar ? 'lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14' : ''}`}>
      <div className="min-w-0 space-y-8">{[0, 1, 2].map(i => <div key={i} className="space-y-4"><Skeleton className="h-6 w-40" /><TextSkeleton lines={i === 0 ? 4 : 6} />{i === 1 && <Skeleton className="aspect-video w-full" />}</div>)}</div>
      {sidebar && <div className="space-y-7 border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"><Skeleton className="h-6 w-28" /><TextSkeleton /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-6 w-36" />{[0, 1].map(i => <div key={i} className="flex gap-3"><Skeleton className="h-9 w-9 shrink-0 rounded-full" /><div className="flex-1"><TextSkeleton lines={2} /></div></div>)}</div>}
    </div>
  </SkeletonRegion>;
}

export function MemberProfileSkeleton() {
  const { t: tr } = useI18n();

  return <div data-skeleton-layout="member-profile"><SkeletonRegion label={tr("Đang tải hồ sơ thành viên")}>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:gap-6"><Skeleton className="h-24 w-24 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-4"><div className="flex flex-wrap gap-3"><Skeleton className="h-8 w-56 max-w-full" /><Skeleton className="h-6 w-28" /></div><TextSkeleton lines={2} /><div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-24" /></div></div></div></div>
  </SkeletonRegion><div className="mb-4 mt-7"><Skeleton className="h-7 w-36" /></div><ManagementRowsSkeleton variant="portfolio" count={4} /></div>;
}

export function FormSkeleton() {
  const { t: tr } = useI18n();

  return <SkeletonRegion label={tr("Đang tải biểu mẫu")} layout="form" className="mx-auto w-full max-w-lg"><div className="panel-detail space-y-6">
    <Skeleton className="mx-auto h-8 w-40" /><Skeleton className="mx-auto h-4 w-3/4" />
    {[0, 1].map(i => <div key={i} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-12 w-full" /></div>)}
    <Skeleton className="h-12 w-full" /><div className="border-t border-slate-200 pt-4"><Skeleton className="mx-auto h-4 w-3/4" /></div>
  </div></SkeletonRegion>;
}

export function SelectionRowsSkeleton({ members = false }: { members?: boolean }) {
  const { t: tr } = useI18n();

  return <SkeletonRegion label={members ? tr("Đang tải thành viên") : tr("Đang tải bài đăng")} layout="selection-rows"><div className="divide-y divide-slate-100">{[0, 1, 2].map(i => <div key={i} className="flex min-h-14 items-start gap-3 px-3 py-3">
    <Skeleton className="mt-1 h-4 w-4 shrink-0" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-5 w-4/5" /><div className="flex gap-2"><Skeleton className="h-4 w-24" />{!members && <Skeleton className="h-4 w-20" />}</div></div>
  </div>)}</div></SkeletonRegion>;
}

export function GallerySkeleton({ research = false }: { research?: boolean }) {
  const { t: tr } = useI18n();

  if (research) return <SkeletonRegion label={tr("Đang tải hướng nghiên cứu")} layout="research-directions"><div className="mt-8 grid gap-10 md:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="min-w-0 space-y-5">
    <Skeleton className="aspect-[4/3] w-full !bg-slate-500/40" /><Skeleton className="h-7 w-4/5 !bg-slate-500/40" />
    <div className="space-y-3">{[0, 1, 2].map(line => <Skeleton key={line} className={`${line === 2 ? 'w-3/4' : 'w-full'} h-4 !bg-slate-500/40`} />)}</div>
  </div>)}</div></SkeletonRegion>;
  return <SkeletonRegion label={tr("Đang tải hình ảnh hoạt động")} layout="moments"><div className="overflow-hidden py-10">
    <div className="container mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8"><Skeleton className="h-3 w-36" /><Skeleton className="h-10 w-80 max-w-full" /></div>
    <div className="mt-8 space-y-6">{[0, 1].map(row => <div key={row} className={`flex gap-6 ${row ? '-translate-x-16' : ''}`}>{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className={`h-44 shrink-0 sm:h-52 ${i % 2 ? 'w-44 sm:w-52' : 'w-64 sm:w-80'}`} />)}</div>)}</div>
  </div></SkeletonRegion>;
}
