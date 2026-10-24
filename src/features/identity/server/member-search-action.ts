'use server';
import { commandFailure } from '@/server/db/command-error';
import { prisma } from '@/server/db/prisma';
import type { ActionResult } from '@/shared/lib/action-result';
import { pageBounds, type Page } from '@/shared/lib/pagination';
import { literalSearchPattern } from '@/shared/lib/search-text';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getActor } from './actor';

const inputSchema = z.object({ q: z.string().trim().max(200), page: z.number().int().positive().max(1_000_000) }).strict();
export async function searchContributors(input: { q: string; page: number }): Promise<ActionResult<Page<{ id: string; fullName: string }>>> {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false, code: 'UNAUTHORIZED', error: 'Bạn không có quyền tìm người đóng góp.' };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Từ khóa tối đa 200 ký tự và trang phải hợp lệ.' };
  const where = Prisma.sql`status = 'ACTIVE' AND "deletedAt" IS NULL AND role::text IN ('ADMIN', 'CORE_MEMBER', 'MEMBER')
    AND regexp_replace(translate(normalize(lower("fullName"), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g') LIKE ${literalSearchPattern(parsed.data.q)}`;
  try {
    const [count] = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM users WHERE ${where}`);
    const total = Number(count.total);
    const { page, skip, take, totalPages } = pageBounds(parsed.data.page, total, 20);
    const items = await prisma.$queryRaw<Array<{ id: string; fullName: string }>>(Prisma.sql`SELECT id, "fullName" FROM users WHERE ${where} ORDER BY "fullName", id LIMIT ${take} OFFSET ${skip}`);
    return { success: true, data: { items, total, page, pageSize: take, totalPages } };
  } catch (error) { return commandFailure('member.search', error, { actorId: actor.id }); }
}
