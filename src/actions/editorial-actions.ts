'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import {
  cuidSchema,
  editorialDraftInputSchema,
  editorialHandoffInputSchema,
  rejectShowcaseInputSchema,
  requestAuthorRevisionInputSchema,
  reviewCommentInputSchema,
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

export async function assignEditorAction(
  itemId: string,
  editorId?: string | null
): Promise<ActionResult<{ assignedEditorId: string | null }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền phân công biên tập.' };

  const parsedItem = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedItem.success) return invalid(parsedItem.error);

  let targetEditorId: string | null = editorId ?? null;
  if (actor.role === 'EDITOR') {
    if (editorId && editorId !== actor.id) {
      return { success: false, error: 'Biên tập viên chỉ có thể nhận bài cho chính mình.' };
    }
    targetEditorId = editorId ?? actor.id;
  } else if (targetEditorId) {
    const target = await prisma.user.findUnique({
      where: { id: targetEditorId },
      select: { role: true, status: true },
    });
    if (!target || !['EDITOR', 'ADMIN'].includes(target.role) || target.status !== 'ACTIVE') {
      return { success: false, error: 'Người được chỉ định không phải biên tập viên hợp lệ.' };
    }
  }

  const item = await prisma.showcaseItem.findUnique({
    where: { id: parsedItem.data },
    select: { id: true },
  });
  if (!item) return { success: false, error: 'Không tìm thấy công trình.' };

  await prisma.$transaction(async (tx) => {
    await tx.editorialDraft.upsert({
      where: { itemId: parsedItem.data },
      create: {
        itemId: parsedItem.data,
        assignedEditorId: targetEditorId,
        overrides: {},
        checklist: {},
      },
      update: {
        assignedEditorId: targetEditorId,
      },
    });

    await tx.auditEvent.create({
      data: {
        itemId: parsedItem.data,
        actorId: actor.id,
        action: 'EDITOR_ASSIGNED',
        metadata: { assignedEditorId: targetEditorId },
      },
    });
  });

  return { success: true, data: { assignedEditorId: targetEditorId } };
}

export async function saveEditorialDraftAction(
  itemId: string,
  overrides: unknown
): Promise<ActionResult<{ itemId: string }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền lưu bản biên tập.' };

  const parsedItem = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedItem.success) return invalid(parsedItem.error);

  const parsedOverrides = editorialDraftInputSchema.safeParse(overrides);
  if (!parsedOverrides.success) return invalid(parsedOverrides.error);

  const item = await prisma.showcaseItem.findUnique({
    where: { id: parsedItem.data },
    select: { id: true },
  });
  if (!item) return { success: false, error: 'Không tìm thấy công trình.' };

  await prisma.editorialDraft.upsert({
    where: { itemId: parsedItem.data },
    create: {
      itemId: parsedItem.data,
      assignedEditorId: actor.id,
      overrides: parsedOverrides.data as any,
      checklist: {},
    },
    update: {
      overrides: parsedOverrides.data as any,
    },
  });

  return { success: true, data: { itemId: parsedItem.data } };
}

export async function addReviewCommentAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền thêm phản hồi.' };

  const parsed = reviewCommentInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const item = await prisma.showcaseItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true },
  });
  if (!item) return { success: false, error: 'Không tìm thấy công trình.' };

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.reviewComment.create({
      data: {
        itemId: parsed.data.itemId,
        revisionId: parsed.data.revisionId,
        fieldKey: parsed.data.fieldKey,
        body: parsed.data.body,
        audience: parsed.data.audience,
        severity: parsed.data.severity,
        authorId: actor.id,
        status: 'OPEN',
      },
    });

    await tx.auditEvent.create({
      data: {
        itemId: parsed.data.itemId,
        actorId: actor.id,
        action: 'REVIEW_COMMENT_ADDED',
        metadata: {
          commentId: comment.id,
          fieldKey: parsed.data.fieldKey,
          audience: parsed.data.audience,
          severity: parsed.data.severity,
        },
      },
    });

    return comment;
  });

  return { success: true, data: { id: created.id } };
}

export async function resolveReviewCommentAction(
  commentId: string
): Promise<ActionResult<{ id: string }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền xử lý phản hồi.' };

  const parsed = cuidSchema.safeParse(commentId);
  if (!parsed.success) return invalid(parsed.error);

  const comment = await prisma.reviewComment.findUnique({
    where: { id: parsed.data },
    select: { id: true, itemId: true, status: true },
  });
  if (!comment) return { success: false, error: 'Không tìm thấy phản hồi.' };
  if (comment.status === 'RESOLVED') {
    return { success: true, data: { id: comment.id } };
  }

  await prisma.$transaction(async (tx) => {
    await tx.reviewComment.update({
      where: { id: comment.id },
      data: {
        status: 'RESOLVED',
        resolvedById: actor.id,
        resolvedAt: new Date(),
      },
    });

    await tx.auditEvent.create({
      data: {
        itemId: comment.itemId,
        actorId: actor.id,
        action: 'REVIEW_COMMENT_RESOLVED',
        metadata: { commentId: comment.id },
      },
    });
  });

  return { success: true, data: { id: comment.id } };
}

export async function markReadyForApprovalAction(
  itemIdOrInput: unknown,
  extraPayload?: unknown
): Promise<ActionResult<{ status: string }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền bàn giao phê duyệt.' };

  let rawInput: unknown;
  if (typeof itemIdOrInput === 'string') {
    rawInput = typeof extraPayload === 'object' && extraPayload !== null
      ? { itemId: itemIdOrInput, ...extraPayload }
      : { itemId: itemIdOrInput };
  } else {
    rawInput = itemIdOrInput;
  }

  const parsed = editorialHandoffInputSchema.safeParse(rawInput);
  if (!parsed.success) return invalid(parsed.error);

  const item = await prisma.showcaseItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, status: true, categoryId: true },
  });
  if (!item) return { success: false, error: 'Không tìm thấy công trình.' };
  if (item.status !== 'PENDING_REVIEW') {
    return { success: false, error: 'Chỉ bài đang chờ biên tập mới có thể bàn giao phê duyệt.' };
  }

  const targetCategoryId = parsed.data.categoryId || item.categoryId;
  if (!targetCategoryId) {
    return { success: false, error: 'Bắt buộc phải gán chuyên mục trước khi bàn giao.' };
  }
  const categoryExists = await prisma.category.findUnique({
    where: { id: targetCategoryId },
    select: { id: true },
  });
  if (!categoryExists) {
    return { success: false, error: 'Chuyên mục không tồn tại.' };
  }

  const openRequiredComments = await prisma.reviewComment.count({
    where: {
      itemId: parsed.data.itemId,
      status: 'OPEN',
      severity: 'REQUIRED',
      audience: 'AUTHOR',
    },
  });
  if (openRequiredComments > 0) {
    return { success: false, error: 'Vẫn còn phản hồi yêu cầu bổ sung chưa được giải quyết.' };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const existingDraft = await tx.editorialDraft.findUnique({
      where: { itemId: parsed.data.itemId },
    });
    const currentOverrides = (existingDraft?.overrides as Record<string, any>) || {};
    const newOverrides = { ...currentOverrides, categoryId: targetCategoryId };

    await tx.editorialDraft.upsert({
      where: { itemId: parsed.data.itemId },
      create: {
        itemId: parsed.data.itemId,
        assignedEditorId: existingDraft?.assignedEditorId ?? actor.id,
        overrides: newOverrides,
        checklist: parsed.data.checklist as any,
        completedAt: new Date(),
      },
      update: {
        overrides: newOverrides,
        checklist: parsed.data.checklist as any,
        completedAt: new Date(),
      },
    });

    const val = await tx.showcaseItem.update({
      where: { id: parsed.data.itemId },
      data: {
        status: 'READY_FOR_APPROVAL',
        categoryId: targetCategoryId,
      },
      select: { status: true },
    });

    await tx.auditEvent.create({
      data: {
        itemId: parsed.data.itemId,
        actorId: actor.id,
        action: 'READY_FOR_APPROVAL',
        metadata: {
          completedAt: new Date().toISOString(),
          categoryId: targetCategoryId,
        },
      },
    });

    return val;
  });

  return { success: true, data: updated };
}

export async function returnToEditorAction(
  itemIdOrInput: unknown,
  message?: string
): Promise<ActionResult<{ status: string }>> {
  const actor = await getCurrentUser(['ADMIN']);
  if (!actor) return { success: false, error: 'Chỉ quản trị viên có quyền trả lại biên tập.' };

  let rawInput: unknown;
  if (typeof itemIdOrInput === 'string') {
    rawInput = { itemId: itemIdOrInput, reason: message ?? '' };
  } else {
    rawInput = itemIdOrInput;
  }

  const parsed = rejectShowcaseInputSchema.safeParse(rawInput);
  if (!parsed.success) return invalid(parsed.error);

  const item = await prisma.showcaseItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, status: true },
  });
  if (!item) return { success: false, error: 'Không tìm thấy công trình.' };
  if (item.status !== 'READY_FOR_APPROVAL') {
    return { success: false, error: 'Chỉ bài đang chờ phê duyệt mới có thể trả lại biên tập.' };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reviewComment.create({
      data: {
        itemId: parsed.data.itemId,
        fieldKey: 'content',
        body: parsed.data.reason,
        audience: 'EDITORIAL',
        severity: 'REQUIRED',
        authorId: actor.id,
        status: 'OPEN',
      },
    });

    const val = await tx.showcaseItem.update({
      where: { id: parsed.data.itemId },
      data: { status: 'PENDING_REVIEW' },
      select: { status: true },
    });

    await tx.auditEvent.create({
      data: {
        itemId: parsed.data.itemId,
        actorId: actor.id,
        action: 'RETURNED_TO_EDITOR',
        metadata: { reason: parsed.data.reason },
      },
    });

    return val;
  });

  return { success: true, data: updated };
}

export async function requestAuthorRevisionAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền yêu cầu chỉnh sửa.' };
  const parsed = requestAuthorRevisionInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.showcaseItem.findUnique({ where: { id: parsed.data.itemId }, select: { status: true } });
    if (!item || !['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.status)) return null;
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
  return updated ? { success: true, data: updated } : { success: false, error: 'Chỉ bài đang chờ xét duyệt mới có thể yêu cầu sửa.' };
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
