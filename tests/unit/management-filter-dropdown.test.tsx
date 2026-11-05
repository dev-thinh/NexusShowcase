import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { AdminMemberTable } from '@/features/identity/components/admin-member-table';
vi.mock('@/features/identity/components/admin-member-actions', () => ({ AdminMemberActions: () => null }));

it('uses the shared dropdown for both member filters and preserves URL-derived values', () => {
  const html = renderToStaticMarkup(<AdminMemberTable members={[]} query="Nguyễn" roleFilter="CORE_MEMBER" statusFilter="DISABLED" counts={{ ALL: 4, ADMIN: 1, CORE_MEMBER: 2, MEMBER: 1, EDITOR: 0, GUEST: 0 }} total={0} />);
  expect(html.match(/role="combobox"/g)).toHaveLength(2);
  expect(html).not.toContain('<select');
  expect(html).toContain('name="role" value="CORE_MEMBER"');
  expect(html).toContain('name="status" value="DISABLED"');
  expect(html).toContain('Trưởng nhóm (2)');
  expect(html).toContain('Đã vô hiệu hóa');
  expect(html).toContain('value="Nguyễn"');
  expect(html).toContain('Bộ lọc');
});
