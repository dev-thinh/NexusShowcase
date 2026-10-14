import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { TypeBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Users,
  Calendar,
  ExternalLink,
  MessageSquare,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { ItemStatus } from '@prisma/client';

interface AdminReviewsPageProps {
  searchParams: Promise<{ queue?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) {
    redirect('/login?callbackUrl=/admin/reviews');
  }

  const { queue } = await searchParams;

  // Determine current active queue
  const isReadyQueue = actor.role === 'ADMIN' && queue === 'ready';
  const targetStatus: ItemStatus = isReadyQueue ? 'READY_FOR_APPROVAL' : 'PENDING_REVIEW';

  const [items, pendingCount, readyCount] = await Promise.all([
    prisma.showcaseItem.findMany({
      where: { status: targetStatus },
      include: {
        creator: true,
        category: true,
        editorialDraft: {
          include: {
            assignedEditor: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        reviewComments: {
          where: { status: 'OPEN' },
          select: { id: true, audience: true },
        },
        contributors: {
          include: { user: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.showcaseItem.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.showcaseItem.count({ where: { status: 'READY_FOR_APPROVAL' } }),
  ]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <Link
          href={actor.role === 'ADMIN' ? '/admin' : '/'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>{actor.role === 'ADMIN' ? 'Quay lại bàn làm việc quản trị' : 'Về trang chủ'}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hàng đợi xét duyệt &amp; Biên tập
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {actor.role === 'ADMIN'
                ? 'Theo dõi luồng biên tập từ bản gửi của tác giả đến giai đoạn phê duyệt xuất bản.'
                : 'Thẩm định, biên tập ngôn từ, hình ảnh và chuẩn hóa metadata trước khi chuyển Admin phê duyệt.'}
            </p>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg">
            <Link
              href="/admin/reviews?queue=pending"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                !isReadyQueue
                  ? 'bg-[#0F294A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ biên tập</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${!isReadyQueue ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {pendingCount}
              </span>
            </Link>

            {actor.role === 'ADMIN' && (
              <Link
                href="/admin/reviews?queue=ready"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isReadyQueue
                    ? 'bg-[#0F294A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chờ phê duyệt</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isReadyQueue ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {readyCount}
                </span>
              </Link>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={isReadyQueue ? 'Không có bài chờ phê duyệt' : 'Hàng đợi biên tập trống'}
            description={
              isReadyQueue
                ? 'Hiện chưa có bài nộp nào được ban biên tập hoàn thành và bàn giao.'
                : 'Tất cả các bài gửi từ tác giả đã được thẩm định và xử lý xong.'
            }
            actionLabel="Quay lại danh sách"
            actionHref="/admin/reviews"
          />
        ) : (
          <div className="panel-operational p-0 overflow-hidden divide-y divide-slate-200 shadow-2xs">
            {items.map((item) => {
              const assignedEditor = item.editorialDraft?.assignedEditor;
              const openCommentsCount = item.reviewComments.length;

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'READY_FOR_APPROVAL'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status === 'READY_FOR_APPROVAL' ? 'Sẵn sàng duyệt' : 'Chờ biên tập'}
                      </span>
                      <TypeBadge type={item.type} size="sm" />
                      {item.category && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          {item.category.name}
                        </span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.publishedYear}
                      </span>
                    </div>

                    <Link
                      href={`/admin/reviews/${item.id}`}
                      className="block group/title focus-visible:outline-none"
                    >
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover/title:text-blue-600 leading-snug transition-colors">
                        {item.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Tác giả nộp: <strong className="text-slate-700 font-semibold">{item.creator.fullName}</strong>
                      </span>

                      {assignedEditor && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-1 text-blue-700">
                            Biên tập: <strong>{assignedEditor.fullName || assignedEditor.email}</strong>
                          </span>
                        </>
                      )}

                      {openCommentsCount > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-1 text-amber-700 font-medium">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {openCommentsCount} phản hồi mở
                          </span>
                        </>
                      )}

                      {item.mediaDriveUrl && (
                        <>
                          <span className="text-slate-300">·</span>
                          <a
                            href={item.mediaDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Google Drive tư liệu
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                    <Link
                      href={`/admin/reviews/${item.id}`}
                      className="px-3.5 py-2 rounded-lg bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Vào biên tập &amp; Xét duyệt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AcademicFooter />
    </div>
  );
}
