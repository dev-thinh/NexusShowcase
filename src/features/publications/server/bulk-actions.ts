'use server';

import type { Actor } from '@/features/identity/model/session';
import { getActor } from '@/features/identity/server/actor';
import { type BulkPostCounts, type BulkPostEntry, type BulkPostFilter } from '@/features/publications/model/bulk-posts';
import { invalidatePublicationChange } from '@/features/publications/server/invalidation';
import { applyPublicationStates } from '@/features/publications/server/state-commands';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';

const searchSchema = z.object({ query: z.string().trim().max(200), page: z.number().int().min(1).max(1_000_000), filter: z.enum(['ALL', 'PINNED', 'UNPINNED', 'PUBLIC', 'PRIVATE']).default('ALL') }).strict();
export async function searchBulkPostsAction(input: { query: string; page: number; filter?: BulkPostFilter }): Promise<
  { success: true; items: BulkPostEntry[]; total: number; page: number; totalPages: number; counts: BulkPostCounts } | { success: false; error: string }
> {
  if (!await getActor(['ADMIN'])) return { success: false, error: 'Chỉ quản trị viên được quản lý bài đăng.' };
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Điều kiện tìm kiếm không hợp lệ.' };
  try {
    const baseWhere = { status: 'PUBLISHED' as const, ...(parsed.data.query ? { title: { contains: parsed.data.query, mode: 'insensitive' as const } } : {}) };
    const [all, pinned, publicCount] = await Promise.all([
      prisma.showcaseItem.count({ where: baseWhere }),
      prisma.showcaseItem.count({ where: { ...baseWhere, isPinned: true } }),
      prisma.showcaseItem.count({ where: { ...baseWhere, visibility: 'PUBLIC' } }),
    ]);
    const counts: BulkPostCounts = { ALL: all, PINNED: pinned, UNPINNED: all - pinned, PUBLIC: publicCount, PRIVATE: all - publicCount };
    const { filter } = parsed.data;
    const where = { ...baseWhere,
      ...(filter === 'PINNED' ? { isPinned: true } : filter === 'UNPINNED' ? { isPinned: false } : {}),
      ...(filter === 'PUBLIC' || filter === 'PRIVATE' ? { visibility: filter } : {}),
    };
    const total = counts[filter];
    const totalPages = Math.max(1, Math.ceil(total / 10));
    const page = Math.min(parsed.data.page, totalPages);
    const items = await prisma.showcaseItem.findMany({ where, skip: (page - 1) * 10, take: 10,
      select: { id: true, title: true, slug: true, isPinned: true, visibility: true, publishedYear: true },
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    });
    return { success: true, items, total, page, totalPages, counts };
  } catch { return { success: false, error: 'Không tải được danh sách bài đăng. Vui lòng thử lại.' }; }
}
export async function saveBulkPostStatesAction(input: unknown): ReturnType<typeof applyPublicationStates> {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false, code: 'UNAUTHORIZED' as const, error: 'Chỉ Admin được quản lý bài đăng.' };
  return applyAndInvalidate(actor, input);
}
async function applyAndInvalidate(actor: Actor, input: unknown) {
  const result = await applyPublicationStates(actor, input);
  if (result.success) invalidatePublicationChange({ slugs: result.data.slugs, memberIds: [], kind: 'PUBLICATION' });
  return result;
}
