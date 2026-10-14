'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ContributorInput } from '@/lib/action-schemas';

interface ContributorEditorProps {
  value: ContributorInput[];
  clubMembers: Array<{ id: string; fullName: string }>;
  onChange: (value: ContributorInput[]) => void;
}

export function ContributorEditor({ value, clubMembers, onChange }: ContributorEditorProps) {
  const [showDetailedRoles, setShowDetailedRoles] = useState(false);
  const addMember = (userId: string) => {
    if (!userId || value.some((entry) => entry.userId === userId)) return;
    onChange([...value, { userId, role: 'CONTRIBUTOR', displayOrder: value.length }]);
  };
  const update = (index: number, patch: Partial<ContributorInput>) => {
    onChange(value.map((entry, current) => current === index ? { ...entry, ...patch } : entry));
  };

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="club-contributor">Thêm thành viên CLB</label>
        <select id="club-contributor" defaultValue="" onChange={(event) => { addMember(event.target.value); event.target.value = ''; }} className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="">Thêm thành viên CLB</option>
          {clubMembers.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
        </select>
        <button type="button" onClick={() => onChange([...value, { externalName: '', role: 'CONTRIBUTOR', displayOrder: value.length }])} className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800">Thêm người bên ngoài</button>
      </div>

      <label className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={showDetailedRoles} onChange={(event) => setShowDetailedRoles(event.target.checked)} />
        Vai trò chi tiết
      </label>

      <div className="mt-2">
        {value.map((contributor, index) => {
          const member = clubMembers.find((entry) => entry.id === contributor.userId);
          return (
            <div key={`${contributor.userId ?? 'external'}-${index}`} className="grid gap-3 border-t border-slate-200 py-4 sm:grid-cols-[minmax(0,1fr)_13rem_2.75rem] sm:items-center">
              {member ? (
                <p className="text-sm font-semibold text-slate-900">{member.fullName}</p>
              ) : (
                <input value={contributor.externalName ?? ''} onChange={(event) => update(index, { externalName: event.target.value })} aria-label={`Tên người đóng góp ${index + 1}`} placeholder="Họ và tên" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" />
              )}
              {showDetailedRoles ? (
                <select value={contributor.role} onChange={(event) => update(index, { role: event.target.value as ContributorInput['role'] })} aria-label={`Vai trò của người đóng góp ${index + 1}`} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value="PROJECT_LEAD">Trưởng nhóm dự án</option><option value="FIRST_AUTHOR">Tác giả chính</option><option value="CO_AUTHOR">Đồng tác giả</option><option value="ADVISOR">Người hướng dẫn</option><option value="CONTRIBUTOR">Thành viên đóng góp</option>
                </select>
              ) : <span className="text-sm text-slate-500">Thành viên đóng góp</span>}
              <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index).map((entry, order) => ({ ...entry, displayOrder: order })))} aria-label={`Xóa người đóng góp ${index + 1}`} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-rose-700"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
