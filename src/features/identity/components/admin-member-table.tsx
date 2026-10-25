'use client';

import { AdminDeleteMemberModal } from '@/features/identity/components/admin-delete-member-modal';
import { SearchForm as Form } from '@/shared/ui/validated-form';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { AdminRoleToggle } from '@/features/identity/components/admin-role-toggle';
import type { Role } from '@prisma/client';
import { Search, ShieldCheck, User, UserCheck } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import type { ReactNode } from 'react';


interface MemberItem { id: string; fullName: string; avatarUrl?: string | null; role: Role; createdAt: Date | string }
const roleNames: Record<Role, string> = { ADMIN: 'Quản trị viên', CORE_MEMBER: 'Thành viên nòng cốt', MEMBER: 'Thành viên', EDITOR: 'Thành viên', GUEST: 'Khách' };

export function AdminMemberTable({ members, query: searchQuery, roleFilter, counts, total, actions }: { members: MemberItem[]; query: string; roleFilter: 'ALL' | Role; counts: Record<'ALL' | Role, number>; total: number; actions?: ReactNode }) {
  const filteredMembers = members;
  const filters = [
    { value: 'ALL' as const, label: 'Tất cả', count: counts.ALL },
    { value: 'CORE_MEMBER' as const, label: 'Nòng cốt', count: counts.CORE_MEMBER },
    { value: 'MEMBER' as const, label: 'Thành viên', count: counts.MEMBER },
    { value: 'ADMIN' as const, label: 'Quản trị viên', count: counts.ADMIN },
  ];
  return <div className="min-w-0">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Form scroll={false} prefetch={false} action="/admin/members" className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1 sm:max-w-md">
        <input type="hidden" name="role" value={roleFilter} />
        <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><label htmlFor="admin-member-search" className="sr-only">Tìm thành viên theo họ tên</label><input id="admin-member-search" type="search" name="q" defaultValue={searchQuery} maxLength={200} placeholder="Tìm theo họ tên…" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]/30" /></div>
        <button type="submit" className="action-secondary-detail">Tìm kiếm</button>
      </Form>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </div>
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Lọc theo vai trò">{filters.map(filter => <Link key={filter.value} href={`/admin/members?${new URLSearchParams({ role: filter.value, ...(searchQuery ? { q: searchQuery } : {}) })}`} scroll={false} aria-current={roleFilter === filter.value ? 'true' : undefined} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30 ${roleFilter === filter.value ? 'border-[#153D67] bg-[#153D67] font-semibold text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}>{filter.label}<span className="text-xs tabular-nums">{filter.count}</span></Link>)}</div>
    <p className="mb-3 text-sm text-slate-500">{total} thành viên{searchQuery ? ` phù hợp với “${searchQuery}”` : ''}</p>
    <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-label="Danh sách thành viên">
    <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_12rem_minmax(16rem,auto)] gap-4 border-b border-slate-200 bg-[#FFFFFF] px-5 py-3 text-xs font-semibold text-[#1F2937] lg:grid"><span>Thành viên</span><span>Vai trò</span><span className="text-right">Thao tác</span></div>
    {!filteredMembers.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-[#1F2937]">Không tìm thấy thành viên</p><Link href="/admin/members" className="mt-3 text-sm font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link></div> : <ul className="divide-y divide-[#153D67]">{filteredMembers.map(member => <li key={member.id} className="grid min-w-0 gap-3 p-4 transition-colors hover:bg-[#FFFFFF] sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem_minmax(16rem,auto)] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-center gap-3"><MemberAvatar fullName={member.fullName} src={member.avatarUrl} className="h-10 w-10 shrink-0 rounded-full object-cover text-sm" /><div className="min-w-0"><Link href={`/members/${member.id}`} className="break-words text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline">{member.fullName}</Link><p className="mt-1 text-xs text-[#1F2937]">Tham gia {new Date(member.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</p></div></div>
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${member.role === 'ADMIN' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : member.role === 'CORE_MEMBER' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : 'border-slate-200 bg-white text-[#1F2937]'}`}>{member.role === 'ADMIN' ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : member.role === 'CORE_MEMBER' ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <User aria-hidden="true" className="h-3.5 w-3.5" />}{roleNames[member.role]}</span>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 lg:justify-end lg:border-0 lg:pt-0"><AdminRoleToggle userId={member.id} currentRole={member.role} /><AdminDeleteMemberModal member={member} /></div>
    </li>)}</ul>}
    <p aria-live="polite" className="border-t border-slate-200 px-4 py-3 text-xs text-[#1F2937] sm:px-5">Hiển thị {filteredMembers.length} / {total} thành viên</p>
    </section>
  </div>;
}
