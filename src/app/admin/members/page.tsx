import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { AdminMemberTable } from '@/components/admin-member-table';
import { AdminCreateMemberModal } from '@/components/admin-create-member-modal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Quản lý &amp; Phân quyền Thành viên
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-xl">
              Quản lý danh sách thành viên và phân quyền đại diện nộp bài cho CLB.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <AdminCreateMemberModal />
          </div>
        </div>

        {/* Member Table with Search and Filters */}
        <AdminMemberTable members={members} />
      </main>

      <AcademicFooter />
    </div>
  );
}
