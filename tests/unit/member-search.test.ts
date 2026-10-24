import { filterAvailableClubMembers } from '@/features/submissions/components/member-search';
import { createLatestRequestGate } from '@/shared/lib/latest-request';
import { describe, expect, it } from 'vitest';

it('ignores an older lookup that finishes after the latest request', async () => {
  const gate = createLatestRequestGate();
  let releaseOld!: () => void;
  let visible = '';
  const oldId = gate.next();
  const old = new Promise<void>(resolve => { releaseOld = resolve; }).then(() => { if (gate.isCurrent(oldId)) visible = 'old'; });
  const latestId = gate.next();
  await Promise.resolve().then(() => { if (gate.isCurrent(latestId)) visible = 'latest'; });
  releaseOld(); await old;
  expect(visible).toBe('latest');
});

const members = [
  { id: '1', fullName: 'Nguyễn An' },
  { id: '2', fullName: 'Trần Bình' },
  { id: '3', fullName: 'Lê Anh' },
  { id: '4', fullName: 'Phạm Dũng' },
  { id: '5', fullName: 'Hoàng Giang' },
  { id: '6', fullName: 'Vũ Hà' },
  { id: '7', fullName: 'Đặng Khánh' },
];

describe('club member search', () => {
  it('shows available members before typing and excludes selected users', () => {
    expect(filterAvailableClubMembers(members, '   ', ['1']).map(member => member.id)).toEqual(['2', '3', '4', '5', '6', '7']);
  });

  it('matches Vietnamese names without requiring accents or exact casing', () => {
    expect(filterAvailableClubMembers(members, 'NGUYEN', []).map((member) => member.id)).toEqual(['1']);
  });

  it('excludes selected members and limits the visible result set to six', () => {
    expect(filterAvailableClubMembers(members, 'a', ['2']).map((member) => member.id)).toEqual([
      '1', '3', '4', '5', '6', '7',
    ]);
  });
});
