import { getSession as auth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ManagementHeader, ManagementNav, ManagementStat } from '@/components/management-layout';
import { MyPosts } from '@/components/my-posts';
import { matchesPostFilter } from '@/lib/dashboard-items';
import Link from 'next/link';
import { canUserUpload } from '@/lib/permissions';
import { Plus, FileText, Clock, CheckCircle2, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: {
    createdItems: { orderBy: { createdAt: 'desc' }, select: {
      id: true, slug: true, title: true, summary: true, type: true, status: true, reviewStatus: true, reviewVersion: true,
      rejectionReason: true, publishedYear: true, updatedAt: true, thumbnailUrl: true,
    } },
  } });
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/account/change-password');
  const isUploader = canUserUpload(user);

  return <div className="flex min-h-screen flex-col"><Navbar />
    <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ManagementHeader title="Bài đăng của tôi" description="Theo dõi bản nháp, phản hồi và các công trình đã xuất bản.">
        {isUploader && <Link href="/dashboard/items/new" className="action-primary-detail"><Plus aria-hidden="true" className="h-4 w-4" />Đăng bài mới</Link>}
      </ManagementHeader>
      <ManagementNav active="posts" userId={user.id} isAdmin={user.role === 'ADMIN'} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <ManagementStat label="Tổng bài đăng" value={user.createdItems.length} icon={FileText} />
        <ManagementStat label="Đang chờ duyệt" value={user.createdItems.filter(item => matchesPostFilter(item, 'PENDING_REVIEW')).length} icon={Clock} />
        <ManagementStat label="Đã xuất bản" value={user.createdItems.filter(item => item.status === 'PUBLISHED').length} icon={CheckCircle2} />
      </div>
      {!isUploader && <div className="mb-5 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm leading-6 text-slate-700"><Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /><p>Liên hệ quản trị viên để được cấp quyền đăng bài. Bạn vẫn có thể theo dõi các bài hiện có.</p></div>}
      <MyPosts items={user.createdItems} isUploader={isUploader} />
    </main><AcademicFooter /></div>;
}
