'use client';

import { searchContributors } from '@/features/identity/server/member-search-action';
import type { ContributorInput } from '@/features/submissions/model/input';
import { createLatestRequestGate } from '@/shared/lib/latest-request';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const requestGate = useMemo(createLatestRequestGate, []);
  const [knownMembers, setKnownMembers] = useState(clubMembers);
  const [searchRows, setSearchRows] = useState<Array<{ id: string; fullName: string }>>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchPages, setTotalSearchPages] = useState(1);
  const [searchPending, setSearchPending] = useState(false);
  const [searchError, setSearchError] = useState('');
  const selectedUserIds = useMemo(() => value.flatMap((entry) => entry.userId ? [entry.userId] : []), [value]);
  const memberResults = useMemo(
    () => filterAvailableClubMembers(searchRows, memberQuery, selectedUserIds, 20),
    [searchRows, memberQuery, selectedUserIds],
  );
  useEffect(() => {
    if (!isMemberSearchOpen) return;
    const sequence = requestGate.next();
    setSearchPending(true);
    setSearchError('');
    setSearchRows([]);
    const timer = setTimeout(async () => {
      try {
        const result = await searchContributors({ q: memberQuery, page: searchPage });
        if (!requestGate.isCurrent(sequence)) return;
        if (!result.success) { setSearchError(result.error); return; }
        setSearchRows(result.data.items);
        setTotalSearchPages(result.data.totalPages);
        setActiveResult(0);
      } catch { if (requestGate.isCurrent(sequence)) setSearchError('Không tải được danh sách thành viên.'); }
      finally { if (requestGate.isCurrent(sequence)) setSearchPending(false); }
    }, 200);
    return () => { clearTimeout(timer); requestGate.invalidate(); };
  }, [memberQuery, searchPage, isMemberSearchOpen, requestGate]);
  useEffect(() => {
    if (isMemberSearchOpen) memberSearchRef.current?.focus();
  }, [isMemberSearchOpen]);
  const addMember = (userId: string) => {
    if (!userId || value.some((entry) => entry.userId === userId)) return;
    const member = searchRows.find(member => member.id === userId);
    if (member) setKnownMembers(current => [...current.filter(item => item.id !== userId), member]);
    onChange([...value, { userId, role: 'CONTRIBUTOR', displayOrder: value.length }]);
    setMemberQuery('');
    setIsMemberSearchOpen(false);
    setActiveResult(0);
    setSearchPage(1);
  };
  const update = (index: number, patch: Partial<ContributorInput>) => {
    onChange(value.map((entry, current) => current === index ? { ...entry, ...patch } : entry));
  };
  const changeSearchPage = (offset: number) => {
    // Keep keyboard focus inside the picker before disabling a loading control.
    memberSearchRef.current?.focus();
    setSearchPage(page => page + offset);
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

      <label className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-[#1F2937]">
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
            maxLength={200}
            placeholder="Tìm thành viên CLB"
            autoComplete="off"
            onFocus={() => setIsMemberSearchOpen(true)}
            onChange={(event) => {
              setMemberQuery(event.target.value);
              setSearchPage(1);
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
              } else if (event.key === 'Enter' && isMemberSearchOpen && !searchPending && memberResults[activeResult]) {
                event.preventDefault();
                addMember(memberResults[activeResult].id);
              } else if (event.key === 'Escape') {
                setIsMemberSearchOpen(false);
              }
            }}
            className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-[#1F2937] outline-none transition-colors placeholder:text-[#1F2937] hover:border-slate-200 focus:border-slate-200 focus:ring-2 focus:ring-[#153D67]"
          />

            {searchError && <p role="alert" className="mt-2 text-sm text-[#1F2937]">{searchError}</p>}
            {searchPending && <p role="status" className="mt-2 text-xs text-[#1F2937]">Đang tìm thành viên…</p>}
            <div id="club-contributor-results" role="listbox" aria-busy={searchPending} className="mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5">
              {memberResults.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-[#1F2937]">Không tìm thấy thành viên phù hợp</p>
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
                      className={`flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm transition-colors ${index === activeResult ? 'bg-[#FFFFFF] font-semibold text-[#1F2937]' : 'text-[#1F2937] hover:bg-[#FFFFFF]'}`}
                    >
                      {member.fullName}
                    </button>
                  ))}
                </>
              )}
            </div>
            {totalSearchPages > 1 && <div className="mt-2 flex items-center justify-between gap-2"><button type="button" onMouseDown={event => event.preventDefault()} disabled={searchPending || searchPage === 1} onClick={() => changeSearchPage(-1)} className="action-secondary-card">Trang trước</button><span className="text-xs text-[#1F2937]">{searchPage}/{totalSearchPages}</span><button type="button" onMouseDown={event => event.preventDefault()} disabled={searchPending || searchPage === totalSearchPages} onClick={() => changeSearchPage(1)} className="action-secondary-card">Trang sau</button></div>}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {value.map((contributor, index) => {
          const member = knownMembers.find((entry) => entry.id === contributor.userId);
          return (
            <div key={`${contributor.userId ?? 'external'}-${index}`} className="panel-nested grid gap-2 !px-3 !py-1.5 shadow-none xl:grid-cols-[minmax(0,1fr)_10rem_2.25rem] xl:items-center">
              {member ? (
                <p className="text-sm font-semibold text-[#1F2937]">{member.fullName}</p>
              ) : (
                <input value={contributor.externalName ?? ''} onChange={(event) => update(index, { externalName: event.target.value })} aria-label={`Tên người đóng góp ${index + 1}`} placeholder="Họ và tên" className="min-h-9 rounded-md border border-slate-200 px-3 text-sm" />
              )}
              {showDetailedRoles ? (
              <input value={contributor.customRoleTitle ?? (contributor.role === 'CONTRIBUTOR' || contributor.role === 'CUSTOM' ? '' : roleLabels[contributor.role])} maxLength={100} onChange={event => update(index, { role: event.target.value.trim() ? 'CUSTOM' : 'CONTRIBUTOR', customRoleTitle: event.target.value })} aria-label={`Vai trò của người đóng góp ${index + 1}`} placeholder="Vai trò (tùy chọn)" className="min-h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm" />
              ) : <span className="text-sm text-[#1F2937]">{contributor.customRoleTitle || roleLabels[contributor.role] || 'Thành viên đóng góp'}</span>}
              <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index).map((entry, order) => ({ ...entry, displayOrder: order })))} aria-label={`Xóa người đóng góp ${index + 1}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-[#1F2937] transition-colors hover:border-slate-200 hover:bg-[#FFFFFF] hover:text-[#1F2937]"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
