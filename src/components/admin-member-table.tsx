'use client';

import { useState, useMemo } from 'react';
import { Role } from '@prisma/client';
import { AdminRoleToggle } from '@/components/admin-role-toggle';
import { AdminDeleteMemberModal } from '@/components/admin-delete-member-modal';
import { Search, ShieldCheck, UserCheck, User, X } from 'lucide-react';

interface MemberItem {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  studentId: string | null;
  createdAt: Date | string;
}

interface AdminMemberTableProps {
  adminId: string;
  members: MemberItem[];
}

export function AdminMemberTable({ adminId, members }: AdminMemberTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Role filter
      if (roleFilter !== 'ALL' && member.role !== roleFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = member.fullName.toLowerCase().includes(query);
        const matchEmail = member.email.toLowerCase().includes(query);
        const matchMSSV = member.studentId?.toLowerCase().includes(query) || false;
        return matchName || matchEmail || matchMSSV;
      }

      return true;
    });
  }, [members, searchQuery, roleFilter]);

  const counts = useMemo(() => {
    return {
      all: members.length,
      core: members.filter((m) => m.role === 'CORE_MEMBER').length,
      regular: members.filter((m) => m.role === 'MEMBER').length,
      admin: members.filter((m) => m.role === 'ADMIN').length,
    };
  }, [members]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email, MSSV..."
            className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F294A] focus:border-transparent transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl self-start sm:self-auto text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            onClick={() => setRoleFilter('CORE_MEMBER')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'CORE_MEMBER'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Core Member ({counts.core})
          </button>
          <button
            onClick={() => setRoleFilter('MEMBER')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'MEMBER'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Member ({counts.regular})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'ADMIN'
                ? 'bg-white text-amber-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin ({counts.admin})
          </button>
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Thành viên</th>
                <th className="px-6 py-4">Email / Tên đăng nhập</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4 text-right">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy thành viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.fullName}</div>
                          {member.studentId && (
                            <div className="text-[11px] text-slate-400 font-medium">
                              MSSV: {member.studentId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                      {member.email}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                          member.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : member.role === 'CORE_MEMBER'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {member.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-amber-600" />}
                        {member.role === 'CORE_MEMBER' && <UserCheck className="w-3 h-3 text-blue-600" />}
                        {member.role === 'MEMBER' && <User className="w-3 h-3 text-slate-500" />}
                        <span>{member.role}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <AdminRoleToggle
                          adminId={adminId}
                          userId={member.id}
                          currentRole={member.role}
                        />
                        <AdminDeleteMemberModal
                          adminId={adminId}
                          member={member}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
