import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { AdminReviewButton } from '@/components/admin-review-button';
import { TypeBadge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  User,
  Users,
  Calendar,
} from 'lucide-react';

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const adminId = session.user.id;

  const pendingItems = await prisma.showcaseItem.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      creator: true,
      contributors: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bàn làm việc</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Duyệt bài đăng công trình
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thầy vui lòng xem xét nội dung, link tài liệu và danh sách tác giả trước khi xuất bản.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
            {pendingItems.length} bài chờ duyệt
          </span>
        </div>

        {pendingItems.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Không có bài đăng nào cần duyệt</h2>
            <p className="text-xs text-slate-400 mt-1">Tất cả các bài nộp từ sinh viên đã được xử lý xong.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <TypeBadge type={item.type} size="sm" />
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.publishedYear}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Người nộp: {item.creator.fullName}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h2>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <strong className="text-slate-700">Tác giả:</strong>
                    <span className="truncate">
                      {item.contributors
                        .map((c) => c.user?.fullName || c.externalName)
                        .join(', ')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <AdminReviewButton adminId={adminId} itemId={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AcademicFooter />
    </div>
  );
}
