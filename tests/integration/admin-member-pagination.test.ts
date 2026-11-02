import { beforeAll, expect, it } from 'vitest';
import { listAdminMembers } from '@/features/identity/server/member-queries';
import { prisma } from '../fixtures/database';

beforeAll(async () => {
  await prisma.user.createMany({ data: Array.from({ length: 25 }, (_, index) => ({
    email: `pagination-${index}@test.invalid`,
    fullName: `${index < 23 ? 'Nguyễn' : 'Other'} Member ${String(index).padStart(2, '0')}`,
    role: index < 20 ? 'MEMBER' as const : 'CORE_MEMBER' as const,
    status: 'ACTIVE' as const,
  })) });
});

it('returns ten members per page with complete ordered coverage and no duplicates', async () => {
  const pages = await Promise.all([1, 2, 3].map(page => listAdminMembers({ q: '', role: 'ALL', page })));
  expect(pages.map(result => result.items.length)).toEqual([10, 10, 5]);
  for (const result of pages) expect(result).toMatchObject({ total: 25, totalPages: 3, pageSize: 10, counts: { ALL: 25, MEMBER: 20, CORE_MEMBER: 5 } });
  expect(pages.map(result => result.page)).toEqual([1, 2, 3]);
  const ids = pages.flatMap(result => result.items.map(item => item.id));
  expect(new Set(ids).size).toBe(25);
  const expected = await prisma.user.findMany({ select: { id: true }, orderBy: [{ role: 'asc' }, { fullName: 'asc' }, { id: 'asc' }] });
  expect(ids).toEqual(expected.map(user => user.id));
});

it('applies the same ten-member limit to role filters and accent-insensitive search', async () => {
  const filtered = await listAdminMembers({ q: '', role: 'MEMBER', page: 2 });
  expect(filtered).toMatchObject({ total: 20, page: 2, totalPages: 2, pageSize: 10 });
  expect(filtered.items).toHaveLength(10);
  expect(filtered.items.every(item => item.role === 'MEMBER')).toBe(true);
  const searched = await Promise.all([1, 2, 3].map(page => listAdminMembers({ q: 'NGUYEN', role: 'ALL', page })));
  expect(searched.map(result => result.items.length)).toEqual([10, 10, 3]);
  for (const result of searched) expect(result).toMatchObject({ total: 23, totalPages: 3, pageSize: 10 });
  expect(new Set(searched.flatMap(result => result.items.map(item => item.id))).size).toBe(23);
  const combined = await listAdminMembers({ q: 'nguyen', role: 'MEMBER', page: 2 });
  expect(combined).toMatchObject({ total: 20, page: 2, totalPages: 2, pageSize: 10 });
  expect(combined.items).toHaveLength(10);
});

it('clamps out-of-range pages after filtering and handles invalid or empty pages', async () => {
  const last = await listAdminMembers({ q: '', role: 'ALL', page: '999' });
  expect(last).toMatchObject({ total: 25, page: 3, totalPages: 3, pageSize: 10 });
  expect(last.items).toHaveLength(5);
  const searchedLast = await listAdminMembers({ q: 'nguyen', role: 'ALL', page: 999 });
  expect(searchedLast).toMatchObject({ total: 23, page: 3, totalPages: 3, pageSize: 10 });
  expect(searchedLast.items).toHaveLength(3);
  expect(await listAdminMembers({ q: '', role: 'ALL', page: '2oops' })).toMatchObject({ page: 1, pageSize: 10 });
  expect(await listAdminMembers({ q: 'no matching members', role: 'ALL', page: 999 })).toMatchObject({ total: 0, items: [], page: 1, totalPages: 1, pageSize: 10 });
});
