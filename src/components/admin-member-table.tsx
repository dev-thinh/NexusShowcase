'use client';

import { useState, useMemo } from 'react';
import { Role } from '@prisma/client';
import { AdminRoleToggle } from '@/components/admin-role-toggle';
import { AdminDeleteMemberModal } from '@/components/admin-delete-member-modal';
import { Search, ShieldCheck, UserCheck, User, X } from 'lucide-react';

interface MemberItem {
  id: string;
  fullName: string;
  role: Role;
  createdAt: Date | string;
}

interface AdminMemberTableProps {
  members: MemberItem[];
}

export function AdminMemberTable({ members }: AdminMemberTableProps) {
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
        return matchName;
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
            placeholder="Tìm theo họ tên..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-all placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80 self-start sm:self-auto text-xs sm:text-sm font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            onClick={() => setRoleFilter('CORE_MEMBER')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'CORE_MEMBER'
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CORE MEMBER ({counts.core})
          </button>
          <button
            onClick={() => setRoleFilter('MEMBER')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'MEMBER'
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Member ({counts.regular})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin ({counts.admin})
          </button>
        </div>
      </div>

      {/* Member Table */}
      <div className="panel-operational p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Thành viên</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4 text-right">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy thành viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0F294A]/10 text-[#0F294A] font-extrabold flex items-center justify-center text-sm">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm sm:text-base">{member.fullName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-md font-bold border ${
                          member.role === 'ADMIN'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : member.role === 'CORE_MEMBER'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {member.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                        {member.role === 'CORE_MEMBER' && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                        {member.role === 'MEMBER' && <User className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{member.role === 'CORE_MEMBER' ? 'CORE MEMBER' : member.role}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <AdminRoleToggle userId={member.id} currentRole={member.role} />
                        <AdminDeleteMemberModal member={member} />
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
