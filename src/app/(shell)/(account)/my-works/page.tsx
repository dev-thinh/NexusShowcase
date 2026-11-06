import { localizedMetadata } from '@/shared/i18n/metadata';

import { getServerI18n } from '@/shared/i18n/server';
export const generateMetadata = localizedMetadata({ title: 'Công trình của tôi' });

import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ManagementHeader, ManagementStat } from '@/app/(shell)/_components/management-layout';
import { canUserUpload } from '@/features/identity/model/permissions';
import { getSession as auth } from '@/features/identity/server/session';
import { MyPosts } from '@/features/submissions/components/my-posts';
import { postFilters } from '@/features/submissions/model/dashboard-items';
import { authorItemStats, listAuthorItems } from '@/features/submissions/server/queries';
import { prisma } from '@/server/db/prisma';
import { PaginationFooter } from '@/shared/ui/member-pagination';
import { CheckCircle2, Clock, FileText, Info, Plus } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const { t: tr } = await getServerI18n();

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, fullName: true, role: true, mustChangePassword: true } });
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/account/change-password');
  const isUploader = canUserUpload(user);
  const params = await searchParams;
  const query = (params.q ?? '').trim().slice(0, 200);
  const filter = postFilters.find(option => option.value === params.filter)?.value ?? 'ALL';
  const actor = { id: user.id, fullName: user.fullName, role: user.role, status: 'ACTIVE' as const, mustChangePassword: false };
  const [posts, counts] = await Promise.all([listAuthorItems({ actor, q: query, filter, page: params.page }), authorItemStats(actor)]);
  const basePath = '/my-works?' + new URLSearchParams({ filter, ...(query ? { q: query } : {}) });

  return <>
    <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: "Công trình của tôi" }]} />
      <ManagementHeader title={tr("Công trình của tôi")} description={tr("Theo dõi công trình bạn đăng hoặc đóng góp, từ bản nháp đến khi xuất bản.")}>
        {isUploader && <Link href="/my-works/new" className="action-primary-detail"><Plus aria-hidden="true" className="h-4 w-4" />{tr("Đăng bài mới")}</Link>}
      </ManagementHeader>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <ManagementStat label={tr("Tổng công trình")} value={counts.ALL} icon={FileText} />
        <ManagementStat label={tr("Đang chờ duyệt")} value={counts.PENDING_REVIEW} icon={Clock} />
        <ManagementStat label={tr("Đã xuất bản")} value={counts.PUBLISHED} icon={CheckCircle2} />
      </div>
      {!isUploader && <div className="mb-5 flex items-start gap-2 rounded-md border border-slate-200 bg-[#FFFFFF] px-3 py-2 text-sm leading-6 text-[#1F2937]"><Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /><p>{tr("Liên hệ quản trị viên để được cấp quyền đăng bài. Bạn vẫn có thể theo dõi các bài hiện có.")}</p></div>}
      <MyPosts items={posts.items} isUploader={isUploader} query={query} filter={filter} counts={counts} total={posts.total} /><PaginationFooter itemLabel={tr("công trình")} page={posts.page} totalPages={posts.totalPages} pageSize={posts.pageSize} basePath={basePath} ariaLabel={tr("Phân trang bài đăng")} />
    </main></>;
}
