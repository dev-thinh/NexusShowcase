'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ContributorInput } from '@/lib/action-schemas';
import { filterAvailableClubMembers } from './member-search';

const roleLabels: Record<ContributorInput['role'], string> = {
  ADVISOR: 'Người hướng dẫn', FIRST_AUTHOR: 'Tác giả chính', CO_FIRST_AUTHOR: 'Đồng tác giả chính',
  CO_AUTHOR: 'Đồng tác giả', CORRESPONDING_AUTHOR: 'Tác giả liên hệ', PROJECT_LEAD: 'Trưởng nhóm',
  CONTRIBUTOR: '', CUSTOM: '',
};

interface ContributorEditorProps {
  value: ContributorInput[];
  clubMembers: Array<{ id: string; fullName: string }>;
  onChange: (value: ContributorInput[]) => void;
}

export function ContributorEditor({ value, clubMembers, onChange }: ContributorEditorProps) {
  const [showDetailedRoles, setShowDetailedRoles] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const memberSearchRef = useRef<HTMLInputElement>(null);
  const selectedUserIds = useMemo(() => value.flatMap((entry) => entry.userId ? [entry.userId] : []), [value]);
  const memberResults = useMemo(
    () => filterAvailableClubMembers(clubMembers, memberQuery, selectedUserIds),
    [clubMembers, memberQuery, selectedUserIds],
  );
  const hasMoreMemberResults = useMemo(
    () => filterAvailableClubMembers(clubMembers, memberQuery, selectedUserIds, 7).length > 6,
    [clubMembers, memberQuery, selectedUserIds],
  );
  useEffect(() => {
    if (isMemberSearchOpen) memberSearchRef.current?.focus();
  }, [isMemberSearchOpen]);
  const addMember = (userId: string) => {
    if (!userId || value.some((entry) => entry.userId === userId)) return;
    onChange([...value, { userId, role: 'CONTRIBUTOR', displayOrder: value.length }]);
    setMemberQuery('');
    setIsMemberSearchOpen(false);
    setActiveResult(0);
  };
  const update = (index: number, patch: Partial<ContributorInput>) => {
    onChange(value.map((entry, current) => current === index ? { ...entry, ...patch } : entry));
  };

  return (
    <div className="mt-5">
      <div className="flex items-center">
        <div className="flex w-full gap-2">
          <button
            type="button"
            aria-expanded={isMemberSearchOpen}
            aria-controls="club-contributor-search"
            onMouseDown={(event) => {
              if (isMemberSearchOpen) event.preventDefault();
            }}
            onClick={() => setIsMemberSearchOpen((current) => !current)}
            className="action-secondary-detail min-h-11 flex-1 whitespace-nowrap"
          >
            Thêm thành viên CLB
          </button>
          <button type="button" onClick={() => onChange([...value, { externalName: '', role: 'CONTRIBUTOR', displayOrder: value.length }])} className="action-secondary-detail min-h-11 flex-1 whitespace-nowrap">Thêm người bên ngoài</button>
        </div>

      </div>

      <label className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={showDetailedRoles} onChange={event => setShowDetailedRoles(event.target.checked)} />
        Vai trò chi tiết
      </label>

      {isMemberSearchOpen && (
        <div
          id="club-contributor-search"
          className="panel-nested relative mt-3 !p-3 shadow-none"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsMemberSearchOpen(false);
          }}
        >
          <label className="sr-only" htmlFor="club-contributor">Thêm thành viên CLB</label>
          <input
            ref={memberSearchRef}
            id="club-contributor"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isMemberSearchOpen}
            aria-controls="club-contributor-results"
            aria-activedescendant={memberResults[activeResult] ? `club-contributor-${memberResults[activeResult].id}` : undefined}
            value={memberQuery}
            placeholder="Tìm thành viên CLB"
            autoComplete="off"
            onFocus={() => setIsMemberSearchOpen(true)}
            onChange={(event) => {
              setMemberQuery(event.target.value);
              setActiveResult(0);
              setIsMemberSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setIsMemberSearchOpen(true);
                setActiveResult((current) => Math.min(current + 1, Math.max(memberResults.length - 1, 0)));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveResult((current) => Math.max(current - 1, 0));
              } else if (event.key === 'Enter' && isMemberSearchOpen && memberResults[activeResult]) {
                event.preventDefault();
                addMember(memberResults[activeResult].id);
              } else if (event.key === 'Escape') {
                setIsMemberSearchOpen(false);
              }
            }}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

            <div id="club-contributor-results" role="listbox" className="mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5">
              {memberResults.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-slate-500">Không tìm thấy thành viên phù hợp</p>
              ) : (
                <>
                  {memberResults.map((member, index) => (
                    <button
                      key={member.id}
                      id={`club-contributor-${member.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeResult}
                      onMouseEnter={() => setActiveResult(index)}
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => addMember(member.id)}
                      className={`flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm transition-colors ${index === activeResult ? 'bg-slate-100 font-semibold text-slate-950' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {member.fullName}
                    </button>
                  ))}
                  {hasMoreMemberResults && <p className="px-3 py-2 text-xs text-slate-500">Nhập thêm ký tự để thu hẹp kết quả</p>}
                </>
              )}
            </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {value.map((contributor, index) => {
          const member = clubMembers.find((entry) => entry.id === contributor.userId);
          return (
            <div key={`${contributor.userId ?? 'external'}-${index}`} className="panel-nested grid gap-2 !px-3 !py-1.5 shadow-none xl:grid-cols-[minmax(0,1fr)_10rem_2.25rem] xl:items-center">
              {member ? (
                <p className="text-sm font-semibold text-slate-900">{member.fullName}</p>
              ) : (
                <input value={contributor.externalName ?? ''} onChange={(event) => update(index, { externalName: event.target.value })} aria-label={`Tên người đóng góp ${index + 1}`} placeholder="Họ và tên" className="min-h-9 rounded-md border border-slate-300 px-3 text-sm" />
              )}
              {showDetailedRoles ? (
              <input value={contributor.customRoleTitle ?? (contributor.role === 'CONTRIBUTOR' || contributor.role === 'CUSTOM' ? '' : roleLabels[contributor.role])} maxLength={100} onChange={event => update(index, { role: event.target.value.trim() ? 'CUSTOM' : 'CONTRIBUTOR', customRoleTitle: event.target.value })} aria-label={`Vai trò của người đóng góp ${index + 1}`} placeholder="Vai trò (tùy chọn)" className="min-h-9 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm" />
              ) : <span className="text-sm text-slate-500">{contributor.customRoleTitle || roleLabels[contributor.role] || 'Thành viên đóng góp'}</span>}
              <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index).map((entry, order) => ({ ...entry, displayOrder: order })))} aria-label={`Xóa người đóng góp ${index + 1}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
