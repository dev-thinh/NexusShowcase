import { expect, it } from 'vitest';
import { getMemberRoleLabel, MEMBER_ROLE_LABELS } from '@/features/identity/model/member-role';

it('provides exactly the three approved membership names', () => {
  expect(Object.values(MEMBER_ROLE_LABELS)).toEqual(['Ban chủ nhiệm', 'Trưởng nhóm', 'Thành viên']);
});
it.each([
  ['ADMIN', 'Ban chủ nhiệm'], ['CORE_MEMBER', 'Trưởng nhóm'], ['MEMBER', 'Thành viên'],
  ['EDITOR', 'Thành viên'], ['GUEST', 'Thành viên'],
])('renders %s with the shared membership name', (role, label) => {
  expect(getMemberRoleLabel(role)).toBe(label);
});
