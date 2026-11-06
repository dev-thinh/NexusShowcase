'use client';
import { useI18n } from '@/shared/i18n/provider';


import { usePathname } from 'next/navigation';
import { getRoutePresentation } from '@/shared/lib/route-presentation';
import { Skeleton } from './skeleton';
import { ArticleSkeleton, FiltersSkeleton, FormSkeleton, GallerySkeleton, ManagementRowsSkeleton, MemberCardsSkeleton, MemberDirectorySkeleton, MemberProfileSkeleton, MemberWallSkeleton, PublicationSkeleton, SkeletonRegion, StatsSkeleton, TextSkeleton } from './content-skeletons';
import { SubmissionWorkspacePageLoading } from './submission-workspace-loading';

function BreadcrumbSkeleton() {
  return <div className="mb-6 flex gap-2" aria-hidden="true"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-32" /></div>;
}

function PageHeaderSkeleton({ title }: { title?: string }) {
  const { t: tr } = useI18n();

  return <header className="mb-6"><Skeleton className="mb-2 h-3 w-36" /><h1 className="page-title">{tr(title ?? "Đang tải nội dung…")}</h1></header>;
}

function AdminBodySkeleton({ layout }: { layout: string }) {
  const { t: tr } = useI18n();

  if (layout === 'review-preview') return <div className="mx-auto max-w-4xl bg-white p-4 sm:p-6"><BreadcrumbSkeleton /><Skeleton className="mb-4 h-5 w-56 max-w-full" /><ArticleSkeleton sidebar={false} /></div>;
  if (layout === 'review-detail') return <div className="space-y-6"><Skeleton className="h-10 w-40" /><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><ArticleSkeleton sidebar={false} /><SkeletonRegion label={tr("Đang tải công cụ phê duyệt")}><div className="panel-operational space-y-5"><Skeleton className="h-6 w-36" /><TextSkeleton lines={2} /><Skeleton className="h-28 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></SkeletonRegion></div></div>;
  return <div className="min-w-0 space-y-4"><Skeleton className="h-7 w-44" />
    {layout === 'admin-overview' ? <><StatsSkeleton /><SkeletonRegion label={tr("Đang tải thống kê lưu trữ")}><div className="mb-7 space-y-3 rounded-xl border border-slate-200 p-5"><Skeleton className="h-5 w-44" /><Skeleton className="h-3 w-full" /><Skeleton className="h-4 w-1/2" /></div></SkeletonRegion><Skeleton className="h-6 w-44" /><ManagementRowsSkeleton variant="activity" /></> : <>
      <Skeleton className="h-4 w-40" /><FiltersSkeleton management />
      <ManagementRowsSkeleton variant={layout === 'admin-members' ? 'members' : layout === 'admin-reviews' ? 'reviews' : 'posts'} />
    </>}
  </div>;
}

/** Admin loading boundaries sit inside the persistent title and tab layout. */
export function AdminContentSkeleton({ pathname }: { pathname?: string } = {}) {
  const current = usePathname();
  const { layout } = getRoutePresentation(pathname ?? current ?? '/admin');
  return <div data-page-skeleton={layout}><AdminBodySkeleton layout={layout} /></div>;
}

function HomeSkeleton() {
  const { t: tr } = useI18n();

  return <>
    <SkeletonRegion label={tr("Đang tải trang chủ")}><div className="grid min-h-[32rem] items-center gap-8 py-12 lg:grid-cols-2 lg:py-20"><div className="space-y-6"><Skeleton className="h-4 w-56 max-w-full" /><Skeleton className="h-12 w-full sm:h-16" /><Skeleton className="h-12 w-4/5 sm:h-16" /><TextSkeleton /><Skeleton className="h-12 w-48" /></div><Skeleton className="mx-auto hidden aspect-square w-full max-w-sm rounded-full lg:block" /></div></SkeletonRegion>
    <section className="space-y-6 py-10"><Skeleton className="h-8 w-60 max-w-full" /><PublicationSkeleton variant="featured" count={2} /></section>
    <section className="research-band space-y-6 px-4 py-10 sm:px-6"><Skeleton className="h-8 w-60 max-w-full !bg-slate-500/40" /><GallerySkeleton research /></section>
    <GallerySkeleton />
    <section className="members-band space-y-6 px-4 py-10 sm:px-6"><Skeleton className="h-8 w-48 !bg-slate-500/40" /><MemberWallSkeleton dark meta /></section>
  </>;
}

/** Shared by destination transitions and route loading.tsx boundaries. */
export function RoutePageSkeleton({ pathname }: { pathname: string }) {
  const { t: tr } = useI18n();

  const { layout, title } = getRoutePresentation(pathname);
  if (layout === 'workspace') return <div data-page-skeleton={layout}><SubmissionWorkspacePageLoading /></div>;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <main data-page-skeleton={layout} data-admin-skeleton-shell className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <BreadcrumbSkeleton /><div className="mb-5"><h1 className="page-title">{tr("Quản trị")}</h1><Skeleton className="mt-2 h-4 w-64 max-w-full" /></div>
    <div aria-hidden="true" className="mb-6 flex gap-5 overflow-hidden border-b border-slate-200 pb-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-24 shrink-0" />)}</div>
    <AdminBodySkeleton layout={layout} />
  </main>;
  if (layout === 'login') return <main data-page-skeleton={layout} className="container mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:py-12">
    <div aria-hidden="true" className="hidden space-y-6 lg:col-span-7 lg:block"><Skeleton className="h-16 w-72" /><Skeleton className="h-14 w-4/5" /><Skeleton className="h-14 w-3/4" /><TextSkeleton lines={2} /></div><div className="lg:col-span-5"><FormSkeleton /></div>
  </main>;
  return <main data-page-skeleton={layout} data-reveal="off" className={`container mx-auto max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 ${layout === 'home' ? '' : layout === 'member-profile' ? 'py-6 sm:py-8' : 'py-8 sm:py-10'}`}>
    {layout === 'home' ? <HomeSkeleton /> : <>
      <BreadcrumbSkeleton />
      {layout !== 'article' && layout !== 'member-profile' && <PageHeaderSkeleton title={title} />}
      {layout === 'research' || layout === 'projects' ? <><FiltersSkeleton /><PublicationSkeleton variant={layout} /></>
        : layout === 'member-directory' ? <MemberDirectorySkeleton />
        : layout === 'member-cards' ? <MemberCardsSkeleton />
        : layout === 'member-profile' ? <MemberProfileSkeleton />
        : layout === 'article' ? <ArticleSkeleton />
        : layout === 'my-works' ? <><StatsSkeleton personal /><Skeleton className="mb-4 h-6 w-36" /><FiltersSkeleton management /><ManagementRowsSkeleton /></>
        : layout === 'contact' ? <SkeletonRegion label={tr("Đang tải thông tin liên hệ")}><div className="mx-auto max-w-3xl space-y-4">{[0, 1].map(i => <div key={i} className="panel-detail space-y-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-6 w-4/5" /><TextSkeleton lines={4} /><div className="flex gap-3"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-28" /></div></div>)}</div></SkeletonRegion>
        : <SkeletonRegion><TextSkeleton lines={5} /></SkeletonRegion>}
    </>}
  </main>;
}

export default function RouteLoading() {
  const pathname = usePathname();
  return <RoutePageSkeleton pathname={pathname ?? ''} />;
}
