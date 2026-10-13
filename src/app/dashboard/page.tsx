import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import Link from 'next/link';
import { canUserUpload } from '@/lib/permissions';
import { StatusBadge, TypeBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Plus,
  AlertTriangle,
  FolderPlus,
  Calendar,
  Info,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      createdItems: {
        orderBy: { createdAt: 'desc' },
      },
      contributions: {
        include: { item: true },
      },
    },
  });

  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/account/change-password');

  const isUploader = canUserUpload(user);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Bảng điều khiển thành viên
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Xin chào, <strong className="text-slate-900">{user.fullName}</strong> • Vai trò: <strong className="text-[#0F294A]">{user.role}</strong>
            </p>
          </div>

          {user.role === 'ADMIN' ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/dashboard/items/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] active:scale-[0.98] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Đăng tải bài mới</span>
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 font-bold text-sm border border-slate-200 shadow-2xs transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Bàn làm việc Quản trị &amp; Duyệt bài</span>
              </Link>
            </div>
          ) : isUploader ? (
            <Link
              href="/dashboard/items/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] active:scale-[0.98] text-white font-bold text-sm shadow-xs transition-all cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng tải bài mới cho nhóm</span>
            </Link>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs sm:text-sm text-amber-800 max-w-md flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                Tài khoản thành viên. Để đăng tải công trình nghiên cứu, vui lòng liên hệ Quản trị viên để được cấp quyền <strong>CORE MEMBER</strong>.
              </div>
            </div>
          )}
        </div>

        {/* My Created Items */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Các bài đã khởi tạo</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Quản lý vòng đời bài nộp từ bản nháp đến xuất bản</p>
            </div>
            <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {user.createdItems.length} bài
            </span>
          </div>

          {user.createdItems.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title={user.role === 'ADMIN' ? 'Quản trị viên không nộp bài trực tiếp' : 'Bạn chưa tạo bài viết nào'}
              description={
                user.role === 'ADMIN'
                  ? 'Quản trị viên phụ trách thẩm định, phê duyệt bài nộp và phân quyền thành viên.'
                  : isUploader
                  ? 'Bắt đầu đăng tải bài báo khoa học hoặc dự án công nghệ đầu tiên cho nhóm.'
                  : 'Khi được cấp quyền CORE MEMBER, bạn có thể tạo và quản lý bài nộp tại đây.'
              }
              actionLabel={
                user.role === 'ADMIN'
                  ? 'Vào duyệt bài nộp'
                  : isUploader
                  ? 'Tạo bài đầu tiên'
                  : undefined
              }
              actionHref={
                user.role === 'ADMIN'
                  ? '/admin/reviews'
                  : isUploader
                  ? '/dashboard/items/new'
                  : undefined
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {user.createdItems.map((item) => (
                <div
                  key={item.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <TypeBadge type={item.type} size="sm" />
                      <span className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.publishedYear}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{item.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-1 mt-1">{item.summary}</p>

                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Góp ý từ Ban kiểm duyệt:</strong> {item.rejectionReason}
                        </div>
                      </div>
                    )}

                    {!isUploader && (item.status === 'DRAFT' || item.status === 'REJECTED') && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-800 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Bài viết chỉ xem. Tài khoản cần được cấp quyền Core Member để tiếp tục chỉnh sửa &amp; gửi xét duyệt.</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    {isUploader && (item.status === 'DRAFT' || item.status === 'REJECTED' || user.role === 'ADMIN') ? (
                      <Link
                        href={`/dashboard/items/${item.id}/edit`}
                        className="text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        {item.status === 'REJECTED' ? 'Sửa & Nộp lại' : 'Chỉnh sửa'}
                      </Link>
                    ) : !isUploader && (item.status === 'DRAFT' || item.status === 'REJECTED') ? (
                      <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed">
                        Chỉ xem
                      </span>
                    ) : null}
                    <Link
                      href={`/showcase/${item.slug}`}
                      className="text-sm font-bold text-[#0F294A] hover:text-[#1E3A5F] inline-flex items-center gap-1 group/link"
                    >
                      <span>{item.status === 'PUBLISHED' ? 'Xem bài' : 'Xem trước'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
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
