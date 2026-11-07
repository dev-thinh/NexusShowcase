'use client';

import { useI18n } from '@/shared/i18n/provider';
import { AdminMemberActions } from '@/features/identity/components/admin-member-actions';
import { ManagementFilters } from '@/shared/ui/management-filters';
import { MEMBER_ROLE_LABELS, getMemberRoleLabel } from '@/features/identity/model/member-role';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import type { Role } from '@prisma/client';
import { ShieldCheck, User, UserCheck } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import type { ReactNode } from 'react';


interface MemberItem { id: string; publicSlug: string; fullName: string; avatarUrl?: string | null; role: Role; createdAt: Date | string; status?: string; deletedAt?: Date | string | null; sessionVersion?: number }


export function AdminMemberTable({ members, currentUserId, query: searchQuery, roleFilter, statusFilter = 'ALL', counts, total, actions }: { members: MemberItem[]; currentUserId?: string; query: string; roleFilter: 'ALL' | Role; statusFilter?: 'ALL' | 'ACTIVE' | 'DISABLED'; counts: Record<'ALL' | Role, number>; total: number; actions?: ReactNode }) {
  const { t: tr } = useI18n();

  const filteredMembers = members;
  const filters = [
    { value: 'ALL' as const, label: tr('Tất cả'), count: counts.ALL },
    { value: 'CORE_MEMBER' as const, label: tr(MEMBER_ROLE_LABELS.CORE_MEMBER), count: counts.CORE_MEMBER },
    { value: 'MEMBER' as const, label: tr(MEMBER_ROLE_LABELS.MEMBER), count: counts.MEMBER },
    { value: 'ADMIN' as const, label: tr(MEMBER_ROLE_LABELS.ADMIN), count: counts.ADMIN },
  ];
  return <div className="min-w-0">
    <ManagementFilters action="/admin/members" query={searchQuery} searchId="admin-member-search" searchLabel={tr("Tìm thành viên theo họ tên")} placeholder={tr("Tìm theo họ tên…")} filterName="role" filterValue={roleFilter} filterLabel={tr("Vai trò")} options={filters} additionalFilters={[{ name: 'status', value: statusFilter, label: tr('Trạng thái'), options: [
      { value: 'ALL', label: tr('Tất cả trạng thái') }, { value: 'ACTIVE', label: tr('Đang hoạt động') }, { value: 'DISABLED', label: tr('Đã vô hiệu hóa') },
    ] }]} actions={actions} />
    <p className="mb-3 text-sm text-slate-500">{total}{tr(" thành viên")}{searchQuery ? tr(" phù hợp với “{0}”", searchQuery) : ''}</p>
    <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-label={tr("Danh sách thành viên")}>

    {!filteredMembers.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-[#1F2937]">{tr("Không tìm thấy thành viên")}</p></div> : <ul className="divide-y divide-slate-100">{filteredMembers.map(member => <li key={member.id} className="admin-member-row grid min-w-0 gap-2 p-3 transition-colors hover:bg-[#FFFFFF] sm:p-5">
      <div className="admin-member-identity flex min-w-0 items-center gap-3"><MemberAvatar fullName={member.fullName} src={member.avatarUrl} className="h-10 w-10 shrink-0 rounded-full object-cover text-sm" /><div className="min-w-0"><Link href={`/members/${member.id}`} title={member.fullName} className="admin-member-name min-w-0 truncate text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline">{member.fullName}</Link><p className="admin-member-joined mt-1 text-xs text-[#1F2937]"><span className="sr-only lg:not-sr-only">{tr("Tham gia ")}</span>{`${String(new Date(member.createdAt).getMonth() + 1).padStart(2, '0')}/${new Date(member.createdAt).getFullYear()}`}</p></div></div>
      <div className="admin-member-badges"><span className={`admin-member-role inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${member.role === 'ADMIN' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : member.role === 'CORE_MEMBER' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : 'border-slate-200 bg-white text-[#1F2937]'}`}>{member.role === 'ADMIN' ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : member.role === 'CORE_MEMBER' ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <User aria-hidden="true" className="h-3.5 w-3.5" />}{tr(getMemberRoleLabel(member.role))}</span>
      {((member.status && member.status !== 'ACTIVE') || member.deletedAt) && <span className="admin-member-disabled inline-flex w-fit items-center whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-500">{tr("Đã vô hiệu hóa")}</span>}</div>
      <div role="group" aria-label={tr("Thao tác với {0}", member.fullName)} className="admin-member-actions flex min-w-0 items-center gap-2 lg:justify-end"><AdminMemberActions member={member} isSelf={member.id === currentUserId} /></div>
    </li>)}</ul>}
    </section>
    <p aria-live="polite" className="mt-3 text-right text-xs text-[#1F2937]">{tr("Hiển thị ")}{filteredMembers.length} / {total}{tr(" thành viên")}</p>
  </div>;
}
