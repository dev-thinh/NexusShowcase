import { normalizeSearchText } from '@/shared/lib/search-text';

export interface ClubMemberOption {
  id: string;
  fullName: string;
}

export function filterAvailableClubMembers(
  members: ClubMemberOption[],
  query: string,
  selectedUserIds: string[],
  limit = 6,
): ClubMemberOption[] {
  const normalizedQuery = normalizeSearchText(query.trim());

  const selected = new Set(selectedUserIds);
  const available = (member: ClubMemberOption) => !selected.has(member.id) && normalizeSearchText(member.fullName).includes(normalizedQuery);
  const end = Math.trunc(limit) || 0;
  // Preserve slice's negative-limit semantics for existing callers.
  if (end < 0) return members.filter(available).slice(0, end);
  const result: ClubMemberOption[] = [];
  for (const member of members) {
    if (result.length >= end) break;
    if (available(member)) result.push(member);
  }
  return result;
}
