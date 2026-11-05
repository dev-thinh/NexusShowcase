import { AdminImportMembersModal } from '@/features/identity/components/admin-import-members-modal';
import { AdminGrantMembersModal } from '@/features/identity/components/admin-grant-members-modal';
import { AdminCreateMemberModal } from '@/features/identity/components/admin-create-member-modal';
import { AdminMemberTable } from '@/features/identity/components/admin-member-table';
import { listAdminMembers } from '@/features/identity/server/member-queries';
import { getSession as auth } from '@/features/identity/server/session';
import { PaginationFooter } from '@/shared/ui/member-pagination';
import { Role } from '@prisma/client';

import { redirect } from 'next/navigation';

export const metadata = { title: 'Quản lý thành viên' };

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string }> }) {
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
  const status = params.status === 'ACTIVE' || params.status === 'DISABLED' ? params.status : 'ALL';
  const result = await listAdminMembers({ q: query, role, status, page: params.page });
  const basePath = '/admin/members?' + new URLSearchParams({ role, status, ...(query ? { q: query } : {}) });

  return (
    <>


      <section aria-labelledby="admin-members-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="admin-members-title" className="text-lg font-semibold text-slate-900">Thành viên</h2><p className="mt-1 text-sm text-slate-500">Quản lý tài khoản và quyền đăng bài.</p></div>
        </div>

        {/* Member Table with Search and Filters */}
        <AdminMemberTable members={result.items} currentUserId={session.user.id} query={query} roleFilter={role} statusFilter={status} counts={result.counts} total={result.total} actions={<div className="flex min-w-0 flex-wrap justify-end gap-2"><AdminCreateMemberModal /><AdminImportMembersModal /><AdminGrantMembersModal /></div>} /><PaginationFooter itemLabel="thành viên" page={result.page} totalPages={result.totalPages} pageSize={10} basePath={basePath} ariaLabel="Phân trang thành viên" />
      </section>


    </>
  );
}
