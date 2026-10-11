import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { TypeBadge } from '@/components/ui/badge';
import { PinToggleButton } from '@/components/pin-toggle-button';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Users,
  ArrowRight,
  Pin,
  Sparkles,
  ExternalLink,
  Calendar,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const [pendingCount, totalMembers, pinnedItems] = await Promise.all([
    prisma.showcaseItem.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.showcaseItem.findMany({
      where: { status: 'PUBLISHED', isPinned: true },
      orderBy: { pinnedAt: 'desc' },
      take: 10,
    }),
  ]);

  const pinnedCount = pinnedItems.length;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        {/* Banner */}
        <div className="bg-[#0F294A] text-white p-6 sm:p-10 rounded-2xl shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#163860]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs sm:text-sm font-bold mb-3 border border-white/15">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Khu vực Quản trị Học thuật</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif">
              Bàn làm việc của Thầy Chủ Nhiệm
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Thẩm định công trình nghiên cứu xuất bản, quản lý bài ghim trang chủ và phân quyền thành viên CLB.
            </p>
          </div>
        </div>

        {/* Action Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link
            href="/admin/reviews"
            className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Cần xử lý
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-serif">Bài nộp đang chờ duyệt</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Xem chi tiết công trình, duyệt 1-click hoặc gửi yêu cầu chỉnh sửa cho nhóm nghiên cứu.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xl font-black text-amber-700 font-serif">{pendingCount} bài</span>
              <span className="text-sm font-bold text-[#0F294A] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                <span>Vào duyệt ngay</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <Link
            href="/admin/members"
            className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0F294A] flex items-center justify-center font-bold border border-blue-200">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Thành viên
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-serif">Quản lý &amp; Phân quyền</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Tạo tài khoản mới, thăng hạng lên Core Member để ủy quyền nộp bài cho nhóm.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 font-serif">{totalMembers} thành viên</span>
              <span className="text-sm font-bold text-[#0F294A] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                <span>Quản lý danh sách</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
                  <Pin className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Trang chủ
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-serif">Công trình đang ghim</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Tối đa 10 công trình được ghim nổi bật trên thanh cuộn phim của trang khám phá.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600 font-serif">{pinnedCount} / 10 bài</span>
              <a
                href="/"
                target="_blank"
                className="text-sm font-bold text-[#0F294A] hover:underline inline-flex items-center gap-1"
              >
                <span>Xem trang chủ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Pinned Showcase Management Panel */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 mb-1.5">
                <Pin className="w-3.5 h-3.5" />
                <span>Tuyển chọn Hội đồng</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-serif">
                Danh Sách 10 Công Trình Tiêu Biểu Đang Ghim
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              Bạn có thể bấm vào công trình để xem chi tiết hoặc bấm nút Bỏ ghim để nhường chỗ cho công trình mới.
            </p>
          </div>

          {pinnedItems.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Chưa có công trình nào được ghim riêng</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Hiện trang chủ đang tự động bù 10 công trình mới xuất bản nhất. Hãy vào trang chi tiết của một công trình bất kỳ để ghim lên trang chủ.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pinnedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 px-3 -mx-3 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="w-6 text-center text-sm font-bold text-slate-400 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TypeBadge type={item.type} size="sm" />
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.publishedYear}
                        </span>
                      </div>
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="text-base font-bold text-slate-900 hover:text-[#0F294A] font-serif transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/showcase/${item.slug}`}
                      className="h-10 px-3.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Xem</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <PinToggleButton
                      adminId={(session.user as any).id}
                      itemId={item.id}
                      initialIsPinned={true}
                      status={item.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AcademicFooter />
    </div>
  );
}
