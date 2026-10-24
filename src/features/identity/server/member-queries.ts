import { prisma } from '@/server/db/prisma';
import { pageBounds } from '@/shared/lib/pagination';
import { literalSearchPattern } from '@/shared/lib/search-text';
import { Prisma, type Role } from '@prisma/client';
import 'server-only';
import { adminMemberClientSelect } from '../model/public-user';

export async function listAdminMembers(input: { q: string; role: Role | 'ALL'; page: unknown }) {
  const where: Prisma.UserWhereInput = input.role === 'ALL' ? {} : { role: input.role };
  let total: number;
  let ids: string[] | undefined;
  let bounds;
  if (input.q.trim()) {
    const role = input.role === 'ALL' ? Prisma.sql`TRUE` : Prisma.sql`role::text = ${input.role}`;
    const predicate = Prisma.sql`${role} AND regexp_replace(translate(normalize(lower("fullName"), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g') LIKE ${literalSearchPattern(input.q.trim())}`;
    const [count] = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM users WHERE ${predicate}`);
    total = Number(count.total);
    bounds = pageBounds(input.page, total, 20);
    ids = (await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM users WHERE ${predicate} ORDER BY role, "fullName", id LIMIT ${bounds.take} OFFSET ${bounds.skip}`)).map(row => row.id);
  } else {
    total = await prisma.user.count({ where });
    bounds = pageBounds(input.page, total, 20);
  }
  const items = await prisma.user.findMany({ where: { ...where, ...(ids ? { id: { in: ids } } : {}) }, select: adminMemberClientSelect, orderBy: [{ role: 'asc' }, { fullName: 'asc' }, { id: 'asc' }], take: bounds.take, ...(ids ? {} : { skip: bounds.skip }) });
  const groups = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  const counts = { ALL: groups.reduce((sum, row) => sum + row._count._all, 0), ADMIN: 0, CORE_MEMBER: 0, MEMBER: 0, EDITOR: 0, GUEST: 0 };
  for (const row of groups) counts[row.role] = row._count._all;
  return { items, total, page: bounds.page, totalPages: bounds.totalPages, pageSize: 20, counts };
}
