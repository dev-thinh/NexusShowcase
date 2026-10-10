import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { canUserUpload } from '@/lib/permissions';
import { StatusBadge, TypeBadge } from '@/components/ui/badge';
import {
  Plus,
  AlertTriangle,
  FolderPlus,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin');

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

  if (!user) redirect('/api/auth/signin');

  const isUploader = canUserUpload(user);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bảng điều khiển thành viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Xin chào, <strong className="text-slate-800">{user.fullName}</strong> • Vai trò: <strong className="text-blue-600">{user.role}</strong>
            </p>
          </div>

          {isUploader ? (
            <Link
              href="/dashboard/items/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng tải bài mới cho nhóm</span>
            </Link>
          ) : (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 max-w-md flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Chế độ thành viên thường:</strong> Bạn có thể xem và chia sẻ Portfolio cá nhân. Để đăng tải bài đại diện cho nhóm, vui lòng liên hệ Thầy chủ nhiệm để được nâng cấp lên <strong>Core Member</strong>.
              </div>
            </div>
          )}
        </div>

        {/* My Created Items */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Các bài bạn đã khởi tạo</h2>
              <p className="text-xs text-slate-400 mt-0.5">Quản lý vòng đời bài nộp từ bản nháp đến xuất bản</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {user.createdItems.length} bài
            </span>
          </div>

          {user.createdItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <FolderPlus className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Bạn chưa tạo bài viết nào</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {isUploader
                  ? 'Bắt đầu đăng tải bài báo khoa học hoặc dự án công nghệ đầu tiên cho nhóm.'
                  : 'Khi được phân quyền Core Member, bạn có thể tạo và quản lý bài nộp tại đây.'}
              </p>
              {isUploader && (
                <Link
                  href="/dashboard/items/new"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo bài đầu tiên</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {user.createdItems.map((item) => (
                <div
                  key={item.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <TypeBadge type={item.type} size="sm" />
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.publishedYear}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.summary}</p>

                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Nhận xét từ Thầy chủ nhiệm:</strong> {item.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    {item.status === 'PUBLISHED' && (
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Xem bài →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
