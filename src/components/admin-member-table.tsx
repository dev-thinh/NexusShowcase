'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Role } from '@prisma/client';
import { AdminRoleToggle } from '@/components/admin-role-toggle';
import { AdminDeleteMemberModal } from '@/components/admin-delete-member-modal';
import { Search, ShieldCheck, UserCheck, User, X } from 'lucide-react';

interface MemberItem { id: string; fullName: string; role: Role; createdAt: Date | string }
const roleNames: Record<Role, string> = { ADMIN: 'Quản trị viên', CORE_MEMBER: 'Thành viên nòng cốt', MEMBER: 'Thành viên', EDITOR: 'Thành viên', GUEST: 'Khách' };
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');

export function AdminMemberTable({ members }: { members: MemberItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const filteredMembers = useMemo(() => members.filter(member => (roleFilter === 'ALL' || member.role === roleFilter) && normalize(member.fullName).includes(normalize(searchQuery.trim()))), [members, searchQuery, roleFilter]);
  const filters = [
    { value: 'ALL' as const, label: 'Tất cả', count: members.length },
    { value: 'CORE_MEMBER' as const, label: 'Nòng cốt', count: members.filter(member => member.role === 'CORE_MEMBER').length },
    { value: 'MEMBER' as const, label: 'Thành viên', count: members.filter(member => member.role === 'MEMBER').length },
    { value: 'ADMIN' as const, label: 'Quản trị viên', count: members.filter(member => member.role === 'ADMIN').length },
  ];
  return <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-label="Danh sách thành viên">
    <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-lg font-semibold text-[#0F294A]">Thành viên <span className="ml-1 text-sm font-normal text-slate-500">{members.length}</span></h2>
        <div className="relative w-full sm:max-w-xs"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><label htmlFor="admin-member-search" className="sr-only">Tìm thành viên theo họ tên</label><input id="admin-member-search" type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Tìm theo họ tên…" className="min-h-10 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Xóa từ khóa tìm kiếm" className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-slate-100"><X aria-hidden="true" className="h-4 w-4" /></button>}</div>
      </div>
      <div className="flex max-w-full gap-1 overflow-x-auto" role="group" aria-label="Lọc theo vai trò">{filters.map(filter => <button key={filter.value} type="button" aria-pressed={roleFilter === filter.value} onClick={() => setRoleFilter(filter.value)} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F294A] ${roleFilter === filter.value ? 'bg-blue-50 text-[#0F294A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{filter.label}<span className="tabular-nums opacity-70">{filter.count}</span></button>)}</div>
    </div>
    <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_12rem_minmax(16rem,auto)] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 lg:grid"><span>Thành viên</span><span>Vai trò</span><span className="text-right">Thao tác</span></div>
    {!filteredMembers.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-slate-700">Không tìm thấy thành viên</p><button type="button" onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); }} className="mt-3 text-sm font-semibold text-[#0F294A] hover:underline">Xóa bộ lọc</button></div> : <ul className="divide-y divide-slate-200">{filteredMembers.map(member => <li key={member.id} className="grid min-w-0 gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem_minmax(16rem,auto)] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-[#0F294A]">{member.fullName.charAt(0)}</span><div className="min-w-0"><Link href={`/members/${member.id}`} className="break-words text-sm font-semibold text-slate-900 hover:text-[#0F294A] hover:underline">{member.fullName}</Link><p className="mt-1 text-xs text-slate-500">Tham gia {new Date(member.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</p></div></div>
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${member.role === 'ADMIN' ? 'border-slate-200 bg-slate-100 text-slate-700' : member.role === 'CORE_MEMBER' ? 'border-blue-100 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}>{member.role === 'ADMIN' ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : member.role === 'CORE_MEMBER' ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <User aria-hidden="true" className="h-3.5 w-3.5" />}{roleNames[member.role]}</span>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 lg:justify-end lg:border-0 lg:pt-0"><AdminRoleToggle userId={member.id} currentRole={member.role} /><AdminDeleteMemberModal member={member} /></div>
    </li>)}</ul>}
    <p aria-live="polite" className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">Hiển thị {filteredMembers.length} / {members.length} thành viên</p>
  </section>;
}
