import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { literalSearchPattern } from '@/shared/lib/search-text';
import { pageBounds, type Page } from '@/shared/lib/pagination';
import type { EligibleMember } from '../model/bulk-members';

async function searchPublishingMembers(input: { query: string; page: number }, role: 'MEMBER' | 'CORE_MEMBER'): Promise<Page<EligibleMember>> {
  const roleFilter = role === 'MEMBER' ? Prisma.sql`role = 'MEMBER'` : Prisma.sql`role = 'CORE_MEMBER'`;
  const where = Prisma.sql`${roleFilter} AND status = 'ACTIVE' AND "deletedAt" IS NULL AND "hiddenFromDirectory" = false
    AND regexp_replace(translate(normalize(lower("fullName" || ' ' || email), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g') LIKE ${literalSearchPattern(input.query)}`;
  const [count] = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM users WHERE ${where}`);
  const total = Number(count.total);
  const bounds = pageBounds(input.page, total, 10);
  const items = await prisma.$queryRaw<EligibleMember[]>(Prisma.sql`SELECT id, "fullName", email, "sessionVersion" FROM users WHERE ${where} ORDER BY "fullName", id LIMIT ${bounds.take} OFFSET ${bounds.skip}`);
  return { items, total, page: bounds.page, totalPages: bounds.totalPages, pageSize: bounds.take };
}

export async function searchLifecycleMembers(actorId: string, input: { operation: 'DISABLE' | 'DELETE' | 'RESET'; query: string; page: number }): Promise<Page<EligibleMember>> {
  const active = input.operation !== 'DELETE' ? Prisma.sql`AND status = 'ACTIVE' AND "deletedAt" IS NULL` : Prisma.empty;
  const where = Prisma.sql`role <> 'ADMIN' AND id <> ${actorId} AND "hiddenFromDirectory" = false ${active}
    AND regexp_replace(translate(normalize(lower("fullName" || ' ' || email), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g') LIKE ${literalSearchPattern(input.query)}`;
  const [count] = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM users WHERE ${where}`);
  const total = Number(count.total);
  const bounds = pageBounds(input.page, total, 10);
  const items = await prisma.$queryRaw<EligibleMember[]>(Prisma.sql`SELECT id, "fullName", email, "sessionVersion" FROM users WHERE ${where} ORDER BY "fullName", id LIMIT ${bounds.take} OFFSET ${bounds.skip}`);
  return { items, total, page: bounds.page, totalPages: bounds.totalPages, pageSize: bounds.take };
}

export async function searchGrantMembers(input: { query: string; page: number }) { return searchPublishingMembers(input, 'MEMBER'); }
export async function searchRevokeMembers(input: { query: string; page: number }) { return searchPublishingMembers(input, 'CORE_MEMBER'); }
