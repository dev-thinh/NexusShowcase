import type { Actor } from '@/features/identity/model/session';
import { bulkPostStateSchema } from '@/features/publications/model/bulk-posts';
import { commandFailure, StateConflict } from '@/server/db/command-error';
import { prisma } from '@/server/db/prisma';
import { reportServerError } from '@/server/observability/errors';
import type { ActionResult } from '@/shared/lib/action-result';
import { Prisma } from '@prisma/client';
import 'server-only';
import { z } from 'zod';
export type PinConflictDetails = { requiresReplacement: true; requiredReplacements: number; pinnedItems: Array<{ id: string; title: string }> };

export async function applyPublicationStates(actor: Actor, input: unknown): Promise<ActionResult<{ count: number; slugs: string[] }, PinConflictDetails>> {
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return { success: false, code: 'FORBIDDEN', error: 'Chỉ Admin có quyền thay đổi bài đăng.' };
  const parsed = bulkPostStateSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Danh sách thay đổi không hợp lệ.' };
  const { mode, changes, replaceItemIds } = parsed.data;
  const itemIds = changes.map(change => change.itemId);
  const enabledIds = changes.filter(change => change.enabled).map(change => change.itemId);
  const disabledIds = changes.filter(change => !change.enabled).map(change => change.itemId);
  const pinning = mode === 'pin' && enabledIds.length > 0;
  if (pinning && enabledIds.length > 3) return { success: false, code: 'VALIDATION', error: 'Chỉ được ghim tối đa 3 bài.' };
  try {
    const result = await prisma.$transaction(async tx => {
      const items = await tx.showcaseItem.findMany({ where: { id: { in: itemIds }, status: 'PUBLISHED' }, select: { id: true, slug: true } });
      if (items.length !== itemIds.length) return { success: false as const, code: 'CONFLICT' as const, error: 'Một số bài không còn tồn tại hoặc chưa xuất bản. Vui lòng tải lại danh sách.' };
      let replaced: Array<{ id: string; slug: string }> = [];
      if (pinning) {
        if (replaceItemIds.length) {
          replaced = await tx.showcaseItem.findMany({ where: { id: { in: replaceItemIds }, isPinned: true, status: 'PUBLISHED' }, select: { id: true, slug: true } });
          if (replaced.length !== replaceItemIds.length) return { success: false as const, code: 'CONFLICT' as const, error: 'Danh sách ghim đã thay đổi. Vui lòng chọn lại bài thay thế.' };
        }
        const remaining = await tx.showcaseItem.count({ where: { isPinned: true, status: 'PUBLISHED', id: { notIn: [...itemIds, ...replaceItemIds] } } });
        if (remaining + enabledIds.length > 3) {
          const pinnedItems = await tx.showcaseItem.findMany({ where: { isPinned: true, status: 'PUBLISHED', id: { notIn: itemIds } }, select: { id: true, title: true }, orderBy: [{ pinnedAt: 'desc' }, { id: 'asc' }] });
          return { success: false as const, code: 'CONFLICT' as const, error: 'Chọn bài đang ghim để thay thế. Giới hạn tối đa 3 bài ghim.', details: { requiresReplacement: true as const, requiredReplacements: remaining + replaceItemIds.length + enabledIds.length - 3, pinnedItems } };
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
    return { success: true, data: { count: result.count, slugs: result.slugs } };
  } catch (error) {
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' || error instanceof Error && error.message === 'Bulk post conflict';
    if (!conflict) reportServerError('publication.state', error, { actorId: actor.id });
    return { success: false, code: conflict ? 'CONFLICT' : 'INTERNAL', error: conflict ? 'Dữ liệu vừa thay đổi. Vui lòng tải lại danh sách và thử lại.' : 'Không cập nhật được bài đăng. Vui lòng thử lại.' };
  }
}

export async function setPublicationPin(actor: Actor, input: { itemId: string; enabled: boolean; replaceItemIds?: string[] }): Promise<ActionResult<{ isPinned: boolean; slugs: string[] }, PinConflictDetails>> {
  const parsed = z.object({ itemId: z.string().cuid(), enabled: z.boolean(), replaceItemIds: z.array(z.string().cuid()).optional() }).strict().safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Thông tin ghim không hợp lệ.' };
  input = parsed.data;
  const result = await applyPublicationStates(actor, { mode: 'pin', changes: [{ itemId: input.itemId, enabled: input.enabled }], replaceItemIds: input.replaceItemIds ?? [] });
  return result.success ? { success: true, data: { isPinned: input.enabled, slugs: result.data.slugs } } : result;
}
export async function setPublicationVisibility(actor: Actor, input: { itemId: string; visibility: 'PUBLIC' | 'PRIVATE' }): Promise<ActionResult<{ visibility: 'PUBLIC' | 'PRIVATE'; slugs: string[] }, PinConflictDetails>> {
  const parsed = z.object({ itemId: z.string().cuid(), visibility: z.enum(['PUBLIC', 'PRIVATE']) }).strict().safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Phạm vi không hợp lệ.' };
  input = parsed.data;
  const result = await applyPublicationStates(actor, { mode: 'visibility', changes: [{ itemId: input.itemId, enabled: input.visibility === 'PUBLIC' }] });
  return result.success ? { success: true, data: { visibility: input.visibility, slugs: result.data.slugs } } : result;
}

export async function setPublicationLifecycle(actor: Actor, input: { itemId: string; action: 'REOPEN' | 'ARCHIVE' }): Promise<ActionResult<{ status: string; slug: string; memberIds: string[] }>> {
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return { success: false, code: 'FORBIDDEN', error: 'Chỉ Admin có quyền thực hiện thao tác này.' };
  const parsed = z.object({ itemId: z.string().cuid(), action: z.enum(['REOPEN', 'ARCHIVE']) }).strict().safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Mã bài không hợp lệ.' };
  const { itemId, action } = parsed.data;
  try {
    return await prisma.$transaction(async tx => {
      const item = await tx.showcaseItem.findUnique({ where: { id: itemId }, include: { contributors: { select: { userId: true } } } });
      const allowed = action === 'REOPEN' ? ['REJECTED'] : ['PUBLISHED', 'REJECTED'];
      if (!item || !allowed.includes(item.status)) return { success: false, code: 'CONFLICT', error: 'Trạng thái hiện tại không cho phép thao tác này.' } as const;
      const status = action === 'REOPEN' ? 'DRAFT' : 'ARCHIVED';
      const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: item.reviewVersion, status: item.status }, data: {
        status, reviewStatus: null, reviewVersion: { increment: 1 }, isPinned: false, pinnedAt: null,
        ...(action === 'REOPEN' ? { rejectionReason: null } : {}),
      } });
      if (changed.count !== 1) throw new StateConflict();
      await tx.auditEvent.create({ data: { itemId, actorId: actor.id, action: action === 'REOPEN' ? 'REOPENED' : 'ARCHIVED' } });
      return { success: true, data: { status, slug: item.slug, memberIds: item.contributors.flatMap(contributor => contributor.userId ? [contributor.userId] : []) } } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { return commandFailure('publication.lifecycle', error, { itemId, actorId: actor.id }); }
}
