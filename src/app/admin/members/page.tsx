import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { AdminMemberTable } from '@/components/admin-member-table';
import { AdminCreateMemberModal } from '@/components/admin-create-member-modal';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldCheck, UserCheck } from 'lucide-react';

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const adminId = session.user.id;

  const members = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      studentId: true,
      createdAt: true,
    },
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
              Quản lý &amp; Phân quyền Thành viên CLB
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Thầy có thể tạo tài khoản mới cho sinh viên, thăng hạng lên <strong>Core Member</strong> để phân quyền nộp bài, hoặc xóa tài khoản thành viên khỏi hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <AdminCreateMemberModal adminId={adminId} />
          </div>
        </div>

        {/* Member Table with Search and Filters */}
        <AdminMemberTable adminId={adminId} members={members} />
      </main>

      <AcademicFooter />
    </div>
  );
}
