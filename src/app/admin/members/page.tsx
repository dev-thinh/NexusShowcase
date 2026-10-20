import { getSession as auth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { adminMemberClientSelect } from '@/lib/public-user';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { AdminMemberTable } from '@/components/admin-member-table';
import { AdminCreateMemberModal } from '@/components/admin-create-member-modal';
import { ManagementHeader, ManagementNav } from '@/components/management-layout';

export default async function AdminMembersPage() {
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

  const members = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    select: adminMemberClientSelect,
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl flex-1">
        <ManagementHeader title="Quản lý thành viên" description="Quản lý tài khoản và quyền đăng bài của thành viên.">
          <AdminCreateMemberModal />
        </ManagementHeader>
        <ManagementNav active="members" userId={session.user.id} isAdmin />

        {/* Member Table with Search and Filters */}
        <AdminMemberTable members={members} />
      </main>

      <AcademicFooter />
    </div>
  );
}
