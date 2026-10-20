'use server';

import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { bulkPostInputSchema, bulkPostStateSchema, type BulkPostEntry, type BulkPostFilter, type BulkPostCounts } from '@/lib/bulk-posts';

const searchSchema = z.object({ query: z.string().trim().max(200), page: z.number().int().min(1).max(1_000_000), filter: z.enum(['ALL', 'PINNED', 'UNPINNED', 'PUBLIC', 'PRIVATE']).default('ALL') }).strict();
export async function searchBulkPostsAction(input: { query: string; page: number; filter?: BulkPostFilter }): Promise<
  { success: true; items: BulkPostEntry[]; total: number; page: number; totalPages: number; counts: BulkPostCounts } | { success: false; error: string }
> {
  if (!await getCurrentUser(['ADMIN'])) return { success: false, error: 'Chỉ quản trị viên được quản lý bài đăng.' };
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

type BulkPostResult = { success: true; count: number } | {
  success: false; error: string; requiredReplacements?: number; pinnedItems?: Array<{ id: string; title: string }>;
};

export async function updateBulkPostsAction(input: unknown): Promise<BulkPostResult> {
  if (!await getCurrentUser(['ADMIN'])) return { success: false, error: 'Chỉ quản trị viên được ghim và thay đổi phạm vi hiển thị.' };
  const parsed = bulkPostInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Chọn từ 1 đến 50 bài và thao tác hợp lệ.' };
  const { itemIds, action, replaceItemIds } = parsed.data;
  return applyBulkPostStates({
    mode: action === 'PIN' || action === 'UNPIN' ? 'pin' : 'visibility',
    changes: itemIds.map(itemId => ({ itemId, enabled: action === 'PIN' || action === 'PUBLIC' })),
    replaceItemIds,
  });
}

export async function saveBulkPostStatesAction(input: unknown): Promise<BulkPostResult> {
  if (!await getCurrentUser(['ADMIN'])) return { success: false, error: 'Chỉ quản trị viên được cập nhật bài đăng.' };
  const parsed = bulkPostStateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Danh sách thay đổi không hợp lệ.' };
  return applyBulkPostStates(parsed.data);
}

async function applyBulkPostStates({ mode, changes, replaceItemIds }: z.infer<typeof bulkPostStateSchema>): Promise<BulkPostResult> {
  const itemIds = changes.map(change => change.itemId);
  const enabledIds = changes.filter(change => change.enabled).map(change => change.itemId);
  const disabledIds = changes.filter(change => !change.enabled).map(change => change.itemId);
  const pinning = mode === 'pin' && enabledIds.length > 0;
  if (pinning && enabledIds.length > 3) return { success: false, error: 'Chỉ được ghim tối đa 3 bài.' };
  try {
    const result = await prisma.$transaction(async tx => {
      const items = await tx.showcaseItem.findMany({ where: { id: { in: itemIds }, status: 'PUBLISHED' }, select: { id: true, slug: true } });
      if (items.length !== itemIds.length) return { success: false as const, error: 'Một số bài không còn tồn tại hoặc chưa xuất bản. Vui lòng tải lại danh sách.' };
      let replaced: Array<{ id: string; slug: string }> = [];
      if (pinning) {
        if (replaceItemIds.length) {
          replaced = await tx.showcaseItem.findMany({ where: { id: { in: replaceItemIds }, isPinned: true, status: 'PUBLISHED' }, select: { id: true, slug: true } });
          if (replaced.length !== replaceItemIds.length) return { success: false as const, error: 'Danh sách ghim đã thay đổi. Vui lòng chọn lại bài thay thế.' };
        }
        const remaining = await tx.showcaseItem.count({ where: { isPinned: true, status: 'PUBLISHED', id: { notIn: [...itemIds, ...replaceItemIds] } } });
        if (remaining + enabledIds.length > 3) {
          const pinnedItems = await tx.showcaseItem.findMany({ where: { isPinned: true, status: 'PUBLISHED', id: { notIn: itemIds } }, select: { id: true, title: true }, orderBy: [{ pinnedAt: 'desc' }, { id: 'asc' }] });
          return { success: false as const, error: 'Chọn bài đang ghim để thay thế. Giới hạn tối đa 3 bài ghim.', requiredReplacements: remaining + replaceItemIds.length + enabledIds.length - 3, pinnedItems };
        }
      }
      if (replaced.length) {
        const removed = await tx.showcaseItem.updateMany({ where: { id: { in: replaceItemIds }, isPinned: true, status: 'PUBLISHED' }, data: { isPinned: false, pinnedAt: null } });
        if (removed.count !== replaced.length) throw new Error('Bulk post conflict');
      }
      for (const [ids, enabled] of [[disabledIds, false], [enabledIds, true]] as const) {
        if (!ids.length) continue;
        const data: Prisma.ShowcaseItemUpdateManyMutationInput = mode === 'pin'
          ? { isPinned: enabled, pinnedAt: enabled ? new Date() : null }
          : { visibility: enabled ? 'PUBLIC' : 'PRIVATE' };
        const updated = await tx.showcaseItem.updateMany({ where: { id: { in: [...ids] }, status: 'PUBLISHED' }, data });
        if (updated.count !== ids.length) throw new Error('Bulk post conflict');
      }
      return { success: true as const, count: itemIds.length, slugs: [...items, ...replaced].map(item => item.slug) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!result.success) return result;
    try {
      for (const path of ['/', '/admin', '/dashboard', '/members', '/category/bai-bao-khoa-hoc', '/category/robotics-iot', ...result.slugs.map(slug => `/showcase/${slug}`)]) revalidatePath(path);
    } catch { /* The database transaction has already committed. */ }
    return { success: true, count: result.count };
  } catch (error) {
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' || error instanceof Error && error.message === 'Bulk post conflict';
    return { success: false, error: conflict ? 'Dữ liệu vừa thay đổi. Vui lòng tải lại danh sách và thử lại.' : 'Không cập nhật được bài đăng. Vui lòng thử lại.' };
  }
}
