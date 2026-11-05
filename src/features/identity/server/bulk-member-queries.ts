import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { literalSearchPattern } from '@/shared/lib/search-text';
import { pageBounds, type Page } from '@/shared/lib/pagination';
import type { EligibleMember } from '../model/bulk-members';

export async function searchGrantMembers(input: { query: string; page: number }): Promise<Page<EligibleMember>> {
  const where = Prisma.sql`role = 'MEMBER' AND status = 'ACTIVE' AND "deletedAt" IS NULL AND "hiddenFromDirectory" = false
    AND regexp_replace(translate(normalize(lower("fullName" || ' ' || email), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g') LIKE ${literalSearchPattern(input.query)}`;
  const [count] = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM users WHERE ${where}`);
  const total = Number(count.total);
  const bounds = pageBounds(input.page, total, 10);
  const items = await prisma.$queryRaw<EligibleMember[]>(Prisma.sql`SELECT id, "fullName", email, "sessionVersion" FROM users WHERE ${where} ORDER BY "fullName", id LIMIT ${bounds.take} OFFSET ${bounds.skip}`);
  return { items, total, page: bounds.page, totalPages: bounds.totalPages, pageSize: bounds.take };
}
