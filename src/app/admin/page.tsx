import { getSession as auth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { pendingReviewWhere } from '@/lib/direct-review';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ManagementHeader, ManagementNav, ManagementStat } from '@/components/management-layout';
import { TypeBadge } from '@/components/ui/badge';
import { AdminBulkPosts } from '@/components/admin-bulk-posts';
import { PinToggleButton } from '@/components/pin-toggle-button';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Clock, Users, ArrowRight, Pin, ExternalLink } from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const actor = session.user as typeof session.user & { role?: string; mustChangePassword?: boolean };
  if (actor.role !== 'ADMIN') redirect('/');
  if (actor.mustChangePassword) redirect('/account/change-password');

  const [pendingCount, totalMembers, pinnedCount, pinnedItems] = await Promise.all([
    prisma.showcaseItem.count({ where: pendingReviewWhere }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', isPinned: true } }),
    prisma.showcaseItem.findMany({ where: { status: 'PUBLISHED', isPinned: true }, orderBy: { pinnedAt: 'desc' }, take: 10 }),
  ]);

  return <div className="flex min-h-screen flex-col"><Navbar />
    <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ManagementHeader title="Tổng quan quản trị" description="Theo dõi bài chờ duyệt, thành viên và nội dung nổi bật.">
        <AdminBulkPosts mode="pin" />
        <AdminBulkPosts mode="visibility" />
        <Link href="/admin/reviews" className="action-primary-detail">Phê duyệt bài đăng<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </ManagementHeader>
      <ManagementNav active="overview" userId={session.user.id} isAdmin />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <ManagementStat label="Bản nộp chờ duyệt" value={pendingCount} icon={Clock} href="/admin/reviews" attention={pendingCount > 0} />
        <ManagementStat label="Thành viên hoạt động" value={totalMembers} icon={Users} href="/admin/members" />
        <ManagementStat label="Công trình đang ghim" value={pinnedCount} icon={Pin} href="#pinned-items" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section id="pinned-items" className="panel-operational min-w-0 scroll-mt-32 !p-0 !shadow-none" aria-labelledby="pinned-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5"><div><h2 id="pinned-title" className="text-lg font-semibold text-[#0F294A]">Nổi bật trên trang chủ</h2><p className="mt-1 text-xs text-slate-500">{pinnedCount > 3 ? `Đang ghim ${pinnedCount} công trình. Vui lòng bỏ ghim bớt để còn tối đa 3 bài.` : `${pinnedCount}/3 vị trí ghim. Ghim bài mới để chọn công trình cần thay thế khi đã đủ.`}</p></div><Link href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F294A]">Xem trang chủ<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>
          {!pinnedItems.length ? <div className="p-4 sm:p-5"><EmptyState icon={Pin} title="Chưa có công trình được ghim" description="Mở một bài đã xuất bản để ghim lên trang chủ." /></div> : <div className="divide-y divide-slate-200">{pinnedItems.map((item, index) => <div key={item.id} className="flex flex-col justify-between gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-start gap-3"><span className="pt-0.5 text-xs font-semibold tabular-nums text-slate-400">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><TypeBadge type={item.type} size="sm" /><span className="text-xs text-slate-500">{item.publishedYear}</span></div><Link href={`/showcase/${item.slug}`} className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900 hover:text-[#0F294A]">{item.title}</Link></div></div>
            <div className="flex shrink-0 items-center gap-2 self-end xl:self-center"><Link href={`/showcase/${item.slug}`} className="action-secondary-card">Xem bài</Link><PinToggleButton itemTitle={item.title} itemId={item.id} initialIsPinned status={item.status} compact /></div>
          </div>)}</div>}
        </section>
        <aside className="space-y-4" aria-label="Tác vụ quản trị">
          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4"><h2 className={`text-sm font-semibold ${pendingCount ? 'text-amber-800' : 'text-[#0F294A]'}`}>{pendingCount ? `${pendingCount} bản nộp cần xem` : 'Đã xử lý hết bản nộp'}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{pendingCount ? 'Xem nội dung và phản hồi để tác giả hoàn thiện bài đăng.' : 'Bản nộp mới sẽ xuất hiện trong danh sách phê duyệt.'}</p><Link href="/admin/reviews" className="mt-4 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-md bg-brand-button px-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] focus-visible:ring-offset-2">Mở danh sách</Link></div>
          <div className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="mb-2 text-sm font-semibold text-slate-900">Truy cập nhanh</h2>{[{ href: '/admin/members', label: 'Quản lý thành viên' }, { href: '/dashboard', label: 'Bài đăng của tôi' }].map(({ href, label }) => <Link key={href} href={href} className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0F294A] transition-colors hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] focus-visible:ring-offset-2">{label}</Link>)}</div>
        </aside>
      </div>
    </main><AcademicFooter /></div>;
}
