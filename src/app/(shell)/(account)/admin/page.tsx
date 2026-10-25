import { ManagementStat } from '@/app/(shell)/_components/management-layout';
import { getSession as auth } from '@/features/identity/server/session';
import { StatusBadge } from '@/features/publications/components/badges';
import { pendingReviewWhere } from '@/features/review/model/review-state';
import { prisma } from '@/server/db/prisma';
import { Clock, Pin, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/');
  if (session.user.mustChangePassword) redirect('/account/change-password');
  const [pendingCount, totalMembers, pinnedCount, recent] = await Promise.all([
    prisma.showcaseItem.count({ where: pendingReviewWhere }),
    prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', isPinned: true } }),
    prisma.showcaseItem.findMany({ where: { status: { in: ['PUBLISHED', 'PENDING_REVIEW', 'READY_FOR_APPROVAL'] } }, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], take: 5, select: { id: true, slug: true, title: true, status: true, reviewStatus: true, updatedAt: true } }),
  ]);
  return <section aria-labelledby="admin-overview-title">
    <h2 id="admin-overview-title" className="mb-4 text-lg font-semibold text-slate-900">Tổng quan</h2>
    <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <ManagementStat label="Bản nộp chờ duyệt" value={pendingCount} icon={Clock} href="/admin/reviews" attention={pendingCount > 0} />
      <ManagementStat label="Thành viên hoạt động" value={totalMembers} icon={Users} href="/admin/members" />
      <ManagementStat label="Công trình đang ghim" value={pinnedCount} icon={Pin} href="/admin/content?filter=PINNED" />
    </div>
    <h3 className="mb-3 text-base font-semibold text-slate-900">Hoạt động gần đây</h3>
    <div className="panel-operational divide-y divide-slate-100 overflow-hidden !rounded-xl !p-0 !shadow-none">
      {!recent.length ? <p className="p-6 text-sm text-slate-500">Chưa có hoạt động nào.</p> : recent.map(item => {
        const reviewing = item.status !== 'PUBLISHED' || item.reviewStatus === 'PENDING_REVIEW';
        return <Link key={item.id} href={reviewing ? `/admin/reviews/${item.id}` : `/admin/content?${new URLSearchParams({ q: item.title })}`} scroll={false} className="flex flex-col justify-between gap-2 p-4 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67]/30 sm:flex-row sm:items-center sm:px-5">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{item.title}</span>
          <span className="flex shrink-0 items-center gap-3"><StatusBadge status={item.reviewStatus ?? item.status} size="sm" /><time dateTime={item.updatedAt.toISOString()} className="text-xs text-slate-500">{item.updatedAt.toLocaleDateString('vi-VN')}</time></span>
        </Link>;
      })}
    </div>
  </section>;
}
