import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const [pendingCount, totalMembers, publishedCount] = await Promise.all([
    prisma.showcaseItem.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-8 rounded-3xl shadow-md mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-3 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Khu vực Quản trị Học thuật</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bàn làm việc của Thầy Chủ Nhiệm
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Kiểm duyệt học thuật, phê duyệt công trình xuất bản và bổ nhiệm thành viên nòng cốt (Core Member) cho CLB.
            </p>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link
            href="/admin/reviews"
            className="group p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Cần xử lý
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">Bài nộp đang chờ Thầy duyệt</h2>
              <p className="text-xs text-slate-500 mt-1">
                Xem trước chi tiết công trình, duyệt 1-click hoặc yêu cầu nhóm chỉnh sửa kèm lý do.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600">{pendingCount} bài</span>
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Vào duyệt ngay <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link
            href="/admin/members"
            className="group p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  Thành viên
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Quản lý &amp; Phân quyền Thành viên</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tạo tài khoản mới, thăng hạng lên Core Member (ủy quyền nộp bài cho nhóm) hoặc xóa tài khoản.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">{totalMembers} thành viên</span>
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Quản lý phân quyền <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}
