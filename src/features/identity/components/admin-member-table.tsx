'use client';

import { AdminMemberActions } from '@/features/identity/components/admin-member-actions';
import { SearchForm } from '@/shared/ui/validated-form';
import { MEMBER_ROLE_LABELS, getMemberRoleLabel } from '@/features/identity/model/member-role';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import type { Role } from '@prisma/client';
import { ShieldCheck, User, UserCheck } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import type { ReactNode } from 'react';


interface MemberItem { id: string; publicSlug: string; fullName: string; avatarUrl?: string | null; role: Role; createdAt: Date | string; status?: string; deletedAt?: Date | string | null; sessionVersion?: number }


export function AdminMemberTable({ members, currentUserId, query: searchQuery, roleFilter, statusFilter = 'ALL', counts, total, actions }: { members: MemberItem[]; currentUserId?: string; query: string; roleFilter: 'ALL' | Role; statusFilter?: 'ALL' | 'ACTIVE' | 'DISABLED'; counts: Record<'ALL' | Role, number>; total: number; actions?: ReactNode }) {
  const filteredMembers = members;
  const filters = [
    { value: 'ALL' as const, label: 'Tất cả', count: counts.ALL },
    { value: 'CORE_MEMBER' as const, label: MEMBER_ROLE_LABELS.CORE_MEMBER, count: counts.CORE_MEMBER },
    { value: 'MEMBER' as const, label: MEMBER_ROLE_LABELS.MEMBER, count: counts.MEMBER },
    { value: 'ADMIN' as const, label: MEMBER_ROLE_LABELS.ADMIN, count: counts.ADMIN },
  ];
  return <div className="min-w-0">
    <div className="mb-4 space-y-3">
      <SearchForm action="/admin/members" role="search" aria-label="Tìm kiếm và lọc" className="management-filter-panel flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="flex-1 text-sm">Tìm thành viên theo họ tên<input id="admin-member-search" name="q" type="search" maxLength={200} defaultValue={searchQuery} placeholder="Tìm theo họ tên…" className="mt-1 block h-11 w-full rounded-lg border border-slate-200 px-3" /></label>
        <label className="text-sm">Vai trò<select name="role" defaultValue={roleFilter} className="mt-1 block h-11 rounded-lg border border-slate-200 px-3">{filters.map(filter => <option key={filter.value} value={filter.value}>{filter.label} ({filter.count})</option>)}</select></label>
        <label className="text-sm">Trạng thái<select name="status" defaultValue={statusFilter} className="mt-1 block h-11 rounded-lg border border-slate-200 px-3"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="DISABLED">Đã vô hiệu hóa</option></select></label>
        <button type="submit" className="action-primary-detail min-h-11">Áp dụng</button>
      </SearchForm>
      {actions && <div role="group" aria-label="Thao tác quản lý" className="management-filter-actions flex justify-end">{actions}</div>}
    </div>
    <p className="mb-3 text-sm text-slate-500">{total} thành viên{searchQuery ? ` phù hợp với “${searchQuery}”` : ''}</p>
    <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-label="Danh sách thành viên">

    {!filteredMembers.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-[#1F2937]">Không tìm thấy thành viên</p><Link href="/admin/members" className="mt-3 text-sm font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link></div> : <ul className="divide-y divide-slate-100">{filteredMembers.map(member => <li key={member.id} className="admin-member-row grid min-w-0 gap-2 p-3 transition-colors hover:bg-[#FFFFFF] sm:p-5">
      <div className="admin-member-identity flex min-w-0 items-center gap-3"><MemberAvatar fullName={member.fullName} src={member.avatarUrl} className="h-10 w-10 shrink-0 rounded-full object-cover text-sm" /><div className="min-w-0"><Link href={`/members/${member.id}`} title={member.fullName} className="admin-member-name min-w-0 truncate text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline">{member.fullName}</Link><p className="admin-member-joined mt-1 text-xs text-[#1F2937]">{(member.status && member.status !== 'ACTIVE') || member.deletedAt ? <span className="mr-2 font-semibold">Đã vô hiệu hóa</span> : null}<span className="sr-only lg:not-sr-only">Tham gia </span>{`${String(new Date(member.createdAt).getMonth() + 1).padStart(2, '0')}/${new Date(member.createdAt).getFullYear()}`}</p></div></div>
      <span className={`admin-member-role inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${member.role === 'ADMIN' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : member.role === 'CORE_MEMBER' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : 'border-slate-200 bg-white text-[#1F2937]'}`}>{member.role === 'ADMIN' ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : member.role === 'CORE_MEMBER' ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <User aria-hidden="true" className="h-3.5 w-3.5" />}{getMemberRoleLabel(member.role)}</span>
      <div role="group" aria-label={`Thao tác với ${member.fullName}`} className="admin-member-actions flex min-w-0 items-center gap-2 lg:justify-end"><AdminMemberActions member={member} isSelf={member.id === currentUserId} /></div>
    </li>)}</ul>}
    </section>
    <p aria-live="polite" className="mt-3 text-right text-xs text-[#1F2937]">Hiển thị {filteredMembers.length} / {total} thành viên</p>
  </div>;
}
