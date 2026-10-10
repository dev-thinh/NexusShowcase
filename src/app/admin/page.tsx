import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const [pendingCount, totalMembers] = await Promise.all([
    prisma.showcaseItem.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Bàn làm việc của Thầy Chủ Nhiệm</h1>
          <p className="text-slate-500 mt-1">Quản lý kiểm duyệt học thuật và phân bổ thành viên nòng cốt CLB.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link
            href="/admin/reviews"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-slate-500">Bài nộp đang chờ Thầy duyệt</div>
              <div className="text-3xl font-bold text-amber-600 mt-2">{pendingCount} bài</div>
            </div>
            <span className="text-blue-600 font-bold text-sm">Xem chi tiết →</span>
          </Link>

          <Link
            href="/admin/members"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-slate-500">Tổng số thành viên CLB</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{totalMembers} người</div>
            </div>
            <span className="text-blue-600 font-bold text-sm">Quản lý & Nâng cấp →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
