'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import {
  rejectShowcaseInputSchema,
  requestAuthorRevisionInputSchema,
  showcaseItemIdSchema,
} from '@/lib/action-schemas';
import type { ZodError } from 'zod';

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function invalid(error: ZodError): ActionResult<never> {
  const fieldErrors = Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))
  );
  return { success: false, error: 'Invalid input.', fieldErrors };
}

export async function requestAuthorRevisionAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền yêu cầu chỉnh sửa.' };
  const parsed = requestAuthorRevisionInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.showcaseItem.findUnique({ where: { id: parsed.data.itemId }, select: { status: true } });
    if (!item || item.status !== 'PENDING_REVIEW') return null;
    await tx.reviewComment.create({
      data: {
        itemId: parsed.data.itemId,
        fieldKey: parsed.data.fieldKey ?? 'content',
        body: parsed.data.reason,
        audience: 'AUTHOR',
        severity: 'REQUIRED',
        authorId: actor.id,
      },
    });
    await tx.auditEvent.create({
      data: { itemId: parsed.data.itemId, actorId: actor.id, action: 'AUTHOR_REVISION_REQUESTED' },
    });
    return tx.showcaseItem.update({
      where: { id: parsed.data.itemId },
      data: { status: 'REVISION_REQUESTED' },
      select: { status: true },
    });
  });
  return updated ? { success: true, data: updated } : { success: false, error: 'Chỉ bài đang chờ biên tập mới có thể yêu cầu sửa.' };
}

export async function rejectShowcaseAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  const actor = await getCurrentUser(['ADMIN']);
  if (!actor) return { success: false, error: 'Chỉ quản trị viên có quyền từ chối.' };
  const parsed = rejectShowcaseInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const item = await prisma.showcaseItem.findUnique({ where: { id: parsed.data.itemId }, select: { status: true } });
  if (!item || !['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.status)) {
    return { success: false, error: 'Trạng thái hiện tại không thể bị từ chối.' };
  }
  const updated = await prisma.$transaction(async (tx) => {
    const value = await tx.showcaseItem.update({
      where: { id: parsed.data.itemId },
      data: { status: 'REJECTED', rejectionReason: parsed.data.reason, isPinned: false, pinnedAt: null },
      select: { status: true },
    });
    await tx.auditEvent.create({ data: { itemId: parsed.data.itemId, actorId: actor.id, action: 'REJECTED', metadata: { reason: parsed.data.reason } } });
    return value;
  });
  return { success: true, data: updated };
}

async function adminStatusTransition(
  itemId: string,
  from: string[],
  to: 'DRAFT' | 'ARCHIVED',
  action: string
): Promise<ActionResult<{ status: string }>> {
  const actor = await getCurrentUser(['ADMIN']);
  if (!actor) return { success: false, error: 'Chỉ quản trị viên có quyền thực hiện thao tác này.' };
  const parsed = showcaseItemIdSchema.safeParse(itemId);
  if (!parsed.success) return invalid(parsed.error);
  const item = await prisma.showcaseItem.findUnique({ where: { id: parsed.data }, select: { status: true } });
  if (!item || !from.includes(item.status)) return { success: false, error: 'Chuyển trạng thái không hợp lệ.' };
  const updated = await prisma.$transaction(async (tx) => {
    const value = await tx.showcaseItem.update({
      where: { id: parsed.data },
      data: { status: to, rejectionReason: to === 'DRAFT' ? null : undefined, isPinned: to === 'ARCHIVED' ? false : undefined, pinnedAt: to === 'ARCHIVED' ? null : undefined },
      select: { status: true },
    });
    await tx.auditEvent.create({ data: { itemId: parsed.data, actorId: actor.id, action } });
    return value;
  });
  return { success: true, data: updated };
}

export function reopenShowcaseAction(itemId: string) {
  return adminStatusTransition(itemId, ['REJECTED'], 'DRAFT', 'REOPENED');
}

export function archiveShowcaseAction(itemId: string) {
  return adminStatusTransition(itemId, ['PUBLISHED', 'REJECTED'], 'ARCHIVED', 'ARCHIVED');
}
