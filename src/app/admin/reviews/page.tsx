import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { AdminReviewButton } from '@/components/admin-review-button';
import { TypeBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Users,
  Calendar,
  Eye,
  ExternalLink,
  Tag,
} from 'lucide-react';

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  if ((session.user as any).mustChangePassword) {
    redirect('/account/change-password');
  }

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
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0F294A] mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại bàn làm việc</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Duyệt bài đăng công trình
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Danh sách các công trình do sinh viên gửi lên đang chờ xét duyệt xuất bản.
            </p>
          </div>
          <span className="text-sm font-bold px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-center">
            {pendingItems.length} bài chờ duyệt
          </span>
        </div>

        {pendingItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Không có bài đăng nào cần duyệt"
            description="Tất cả các bài nộp từ sinh viên đã được thẩm định và xử lý xong."
            actionLabel="Quay lại bàn làm việc"
            actionHref="/admin"
          />
        ) : (
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#0F294A]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <TypeBadge type={item.type} size="sm" />
                    <span className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.publishedYear}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Người nộp: {item.creator.fullName}
                    </span>
                  </div>

                  <Link
                    href={`/showcase/${item.slug}`}
                    className="group/title block focus-visible:outline-none"
                  >
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover/title:text-[#0F294A] group-hover/title:underline leading-snug transition-colors">
                      {item.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  {item.mediaDriveUrl && (
                    <div className="mt-3">
                      <a
                        href={item.mediaDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                        <span>Mở Google Drive tư liệu thô (cho Ban Truyền thông)</span>
                      </a>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs sm:text-sm text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0F294A] shrink-0" />
                    <strong className="text-slate-700">Tác giả:</strong>
                    <span className="truncate">
                      {item.contributors
                        .map((c) => c.user?.fullName || c.externalName)
                        .join(', ')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/showcase/${item.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-[#0F294A] text-slate-700 hover:text-[#0F294A] bg-white hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Xem chi tiết</span>
                  </Link>
                  <AdminReviewButton itemId={item.id} />
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
