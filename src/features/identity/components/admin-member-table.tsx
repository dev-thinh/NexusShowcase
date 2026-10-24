'use client';

import { AdminDeleteMemberModal } from '@/features/identity/components/admin-delete-member-modal';
import { AdminRoleToggle } from '@/features/identity/components/admin-role-toggle';
import type { Role } from '@prisma/client';
import { Search, ShieldCheck, User, UserCheck } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';


interface MemberItem { id: string; fullName: string; role: Role; createdAt: Date | string }
const roleNames: Record<Role, string> = { ADMIN: 'Quản trị viên', CORE_MEMBER: 'Thành viên nòng cốt', MEMBER: 'Thành viên', EDITOR: 'Thành viên', GUEST: 'Khách' };

export function AdminMemberTable({ members, query: searchQuery, roleFilter, counts, total }: { members: MemberItem[]; query: string; roleFilter: 'ALL' | Role; counts: Record<'ALL' | Role, number>; total: number }) {
  const filteredMembers = members;
  const filters = [
    { value: 'ALL' as const, label: 'Tất cả', count: counts.ALL },
    { value: 'CORE_MEMBER' as const, label: 'Nòng cốt', count: counts.CORE_MEMBER },
    { value: 'MEMBER' as const, label: 'Thành viên', count: counts.MEMBER },
    { value: 'ADMIN' as const, label: 'Quản trị viên', count: counts.ADMIN },
  ];
  return <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-label="Danh sách thành viên">
    <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-lg font-semibold text-[#1F2937]">Thành viên <span className="ml-1 text-sm font-normal text-[#1F2937]">{total}</span></h2>
        <form method="GET" action="/admin/members" className="relative w-full sm:max-w-xs"><input type="hidden" name="role" value={roleFilter} /><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F2937]" /><label htmlFor="admin-member-search" className="sr-only">Tìm thành viên theo họ tên</label><input id="admin-member-search" type="search" name="q" defaultValue={searchQuery} placeholder="Tìm theo họ tên…" className="min-h-10 w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm outline-none focus:border-slate-200 focus:ring-2 focus:ring-[#153D67]/10" /><button type="submit" className="sr-only">Tìm kiếm</button></form>
      </div>
      <div className="flex max-w-full gap-1 overflow-x-auto" role="group" aria-label="Lọc theo vai trò">{filters.map(filter => <Link key={filter.value} href={`/admin/members?${new URLSearchParams({ role: filter.value, ...(searchQuery ? { q: searchQuery } : {}) })}`} aria-current={roleFilter === filter.value ? "page" : undefined} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67] ${roleFilter === filter.value ? 'bg-[#FFFFFF] text-[#1F2937]' : 'text-[#1F2937] hover:bg-[#FFFFFF] hover:text-[#1F2937]'}`}>{filter.label}<span className="tabular-nums opacity-70">{filter.count}</span></Link>)}</div>
    </div>
    <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_12rem_minmax(16rem,auto)] gap-4 border-b border-slate-200 bg-[#FFFFFF] px-5 py-3 text-xs font-semibold text-[#1F2937] lg:grid"><span>Thành viên</span><span>Vai trò</span><span className="text-right">Thao tác</span></div>
    {!filteredMembers.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-[#1F2937]">Không tìm thấy thành viên</p><Link href="/admin/members" className="mt-3 text-sm font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link></div> : <ul className="divide-y divide-[#153D67]">{filteredMembers.map(member => <li key={member.id} className="grid min-w-0 gap-3 p-4 transition-colors hover:bg-[#FFFFFF] sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem_minmax(16rem,auto)] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FFFFFF] text-sm font-semibold text-[#1F2937]">{member.fullName.charAt(0)}</span><div className="min-w-0"><Link href={`/members/${member.id}`} className="break-words text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline">{member.fullName}</Link><p className="mt-1 text-xs text-[#1F2937]">Tham gia {new Date(member.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</p></div></div>
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${member.role === 'ADMIN' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : member.role === 'CORE_MEMBER' ? 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]' : 'border-slate-200 bg-white text-[#1F2937]'}`}>{member.role === 'ADMIN' ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : member.role === 'CORE_MEMBER' ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <User aria-hidden="true" className="h-3.5 w-3.5" />}{roleNames[member.role]}</span>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 lg:justify-end lg:border-0 lg:pt-0"><AdminRoleToggle userId={member.id} currentRole={member.role} /><AdminDeleteMemberModal member={member} /></div>
    </li>)}</ul>}
    <p aria-live="polite" className="border-t border-slate-200 px-4 py-3 text-xs text-[#1F2937] sm:px-5">Hiển thị {filteredMembers.length} / {total} thành viên</p>
  </section>;
}
