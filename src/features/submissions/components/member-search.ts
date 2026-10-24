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
  return members
    .filter((member) => !selected.has(member.id) && normalizeSearchText(member.fullName).includes(normalizedQuery))
    .slice(0, limit);
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');
}
