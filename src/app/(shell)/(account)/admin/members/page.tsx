import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ManagementHeader, ManagementNav } from '@/app/(shell)/_components/management-layout';
import { AdminCreateMemberModal } from '@/features/identity/components/admin-create-member-modal';
import { AdminMemberTable } from '@/features/identity/components/admin-member-table';
import { listAdminMembers } from '@/features/identity/server/member-queries';
import { getSession as auth } from '@/features/identity/server/session';
import { MemberPagination } from '@/shared/ui/member-pagination';
import { Role } from '@prisma/client';

import { redirect } from 'next/navigation';

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; role?: string }> }) {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect('/login');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }
  if (session.user.mustChangePassword) {
    redirect('/account/change-password');
  }

  const params = await searchParams;
  const query = (params.q ?? '').trim().slice(0, 200);
  const role = Object.values(Role).find(value => value === params.role) ?? 'ALL';
  const result = await listAdminMembers({ q: query, role, page: params.page });
  const basePath = '/admin/members?' + new URLSearchParams({ role, ...(query ? { q: query } : {}) });

  return (
    <>


      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl flex-1">
      <Breadcrumbs items={[{ label: "Quản trị", href: "/admin" }, { label: "Quản lý thành viên" }]} />
        <ManagementHeader title="Quản lý thành viên" description="Quản lý tài khoản và quyền đăng bài của thành viên.">
          <AdminCreateMemberModal />
        </ManagementHeader>
        <ManagementNav active="members" userId={session.user.id} isAdmin />

        {/* Member Table with Search and Filters */}
        <AdminMemberTable members={result.items} query={query} roleFilter={role} counts={result.counts} total={result.total} /><MemberPagination page={result.page} totalPages={result.totalPages} basePath={basePath} />
      </main>


    </>
  );
}
