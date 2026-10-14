'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { slugify } from '@/lib/slugify';
import {
  createShowcaseItemInputSchema,
  INVALID_ACTION_INPUT_ERROR,
  reviewShowcaseItemInputSchema,
  showcaseItemIdSchema,
  toggleItemVisibilityInputSchema,
  type AttachmentInput,
  type ContributorInput,
  type CreateShowcaseItemInput,
  type LinkInput,
  showcaseDraftInputSchema,
  showcaseSubmissionInputSchema,
  type ShowcaseDraftInput,
} from '@/lib/action-schemas';
import { buildSubmissionSnapshot } from '@/lib/submission-snapshot';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import type { ZodError } from 'zod';

export type { AttachmentInput, ContributorInput, CreateShowcaseItemInput, LinkInput };

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function validationFailure(error: ZodError): ActionResult<never> {
  const fieldErrors = Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))
  );
  return { success: false, error: INVALID_ACTION_INPUT_ERROR, fieldErrors };
}

export async function saveShowcaseDraftAction(
  itemId: string | null,
  input: ShowcaseDraftInput
): Promise<ActionResult<{ id: string; slug: string; status: string }>> {
  const user = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!user) return { success: false, error: 'Bạn không có quyền lưu bản nháp.' };

  const parsed = showcaseDraftInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const values = parsed.data;

  const contributorCreates = values.contributors.map((contributor) => ({
    userId: contributor.userId ?? null,
    externalName: contributor.externalName ?? null,
    externalAffiliation: contributor.externalAffiliation ?? null,
    externalLink: contributor.externalLink ?? null,
    role: contributor.role,
    customRoleTitle: contributor.customRoleTitle ?? null,
    displayOrder: contributor.displayOrder,
  }));
  const linkCreates = values.resources.filter((resource) => resource.kind === 'LINK').map((resource) => ({
    label: resource.label,
    url: resource.url,
    type: resource.linkType ?? 'OTHER' as const,
  }));
  const attachmentCreates = values.resources.filter((resource) => resource.kind !== 'LINK').map((resource) => ({
    fileName: resource.fileName ?? resource.label,
    fileUrl: resource.url,
    fileSize: resource.fileSize ?? 0,
    mimeType: resource.mimeType ?? (resource.kind === 'IMAGE' ? 'image/webp' : 'application/pdf'),
  }));

  if (!itemId) {
    let slug = slugify(values.title);
    if (await prisma.showcaseItem.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString().slice(-4)}`;
    const created = await prisma.showcaseItem.create({
      data: {
        title: values.title,
        slug,
        summary: values.summary,
        content: values.content,
        publishedYear: values.publishedYear ?? new Date().getFullYear(),
        suggestedField: values.suggestedField,
        customProjectType: values.customProjectType,
        creatorId: user.id,
        contributors: { create: contributorCreates },
        links: { create: linkCreates },
        attachments: { create: attachmentCreates },
      },
      select: { id: true, slug: true, status: true },
    });
    return { success: true, data: created };
  }

  const parsedId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const target = await prisma.showcaseItem.findUnique({ where: { id: parsedId.data } });
  if (!target) return { success: false, error: 'Không tìm thấy công trình.' };
  if (target.creatorId !== user.id && user.role !== 'ADMIN') return { success: false, error: 'Bạn không có quyền sửa bản nháp này.' };
  if (!['DRAFT', 'REVISION_REQUESTED'].includes(target.status)) {
    return { success: false, error: 'Trạng thái hiện tại không cho phép chỉnh sửa.' };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.itemContributor.deleteMany({ where: { itemId: target.id } }),
      tx.itemLink.deleteMany({ where: { itemId: target.id } }),
      tx.itemAttachment.deleteMany({ where: { itemId: target.id } }),
    ]);
    return tx.showcaseItem.update({
      where: { id: target.id },
      data: {
        title: values.title,
        summary: values.summary,
        content: values.content,
        publishedYear: values.publishedYear ?? target.publishedYear,
        suggestedField: values.suggestedField,
        customProjectType: values.customProjectType,
        contributors: { create: contributorCreates },
        links: { create: linkCreates },
        attachments: { create: attachmentCreates },
      },
      select: { id: true, slug: true, status: true },
    });
  });
  return { success: true, data: updated };
}

export async function submitShowcaseForReviewAction(
  itemId: string
): Promise<ActionResult<{ status: string; revisionNumber: number }>> {
  const user = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!user) return { success: false, error: 'Bạn không có quyền gửi duyệt.' };
  const parsedId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedId.success) return validationFailure(parsedId.error);

  const item = await prisma.showcaseItem.findUnique({
    where: { id: parsedId.data },
    include: { contributors: true, links: true, attachments: true },
  });
  if (!item) return { success: false, error: 'Không tìm thấy công trình.' };
  if (item.creatorId !== user.id && user.role !== 'ADMIN') return { success: false, error: 'Bạn không có quyền gửi công trình này.' };
  if (!['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) return { success: false, error: 'Trạng thái hiện tại không thể gửi duyệt.' };

  const snapshot = buildSubmissionSnapshot(item);
  const validSubmission = showcaseSubmissionInputSchema.safeParse(snapshot);
  if (!validSubmission.success) return validationFailure(validSubmission.error);

  const result = await prisma.$transaction(async (tx) => {
    const latest = await tx.submissionRevision.aggregate({ where: { itemId: item.id }, _max: { revisionNumber: true } });
    const revisionNumber = (latest._max.revisionNumber ?? 0) + 1;
    await tx.submissionRevision.create({
      data: { itemId: item.id, revisionNumber, snapshot: snapshot as unknown as Prisma.InputJsonValue, submittedById: user.id },
    });
    await tx.showcaseItem.update({
      where: { id: item.id },
      data: { status: 'PENDING_REVIEW', rejectionReason: null },
    });
    await tx.auditEvent.create({
      data: { itemId: item.id, actorId: user.id, action: 'SUBMITTED_FOR_REVIEW', metadata: { revisionNumber } },
    });
    return { status: 'PENDING_REVIEW', revisionNumber };
  });
  return { success: true, data: result };
}

export async function createShowcaseItemAction(input: CreateShowcaseItemInput) {
  const user = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!user) {
    return { success: false, error: 'Chỉ Thành viên nòng cốt (Core Member) và Quản trị viên mới có quyền đăng bài.' };
  }

  const parsedInput = createShowcaseItemInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  const values = parsedInput.data;

  let slug = slugify(values.title);
  const existing = await prisma.showcaseItem.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const status = values.submitForReview
    ? 'PENDING_REVIEW'
    : 'DRAFT';

  const item = await prisma.showcaseItem.create({
    data: {
      title: values.title,
      slug,
      summary: values.summary,
      content: values.content,
      type: values.type,
      scope: values.scope,
      issuer: values.issuer,
      thumbnailUrl: values.thumbnailUrl,
      mediaDriveUrl: values.mediaDriveUrl || null,
      tags: values.tags || [],
      categoryId: values.categoryId || null,
      visibility: values.visibility || 'PRIVATE',
      status,
      publishedAt: null,
      publishedYear: values.publishedYear || new Date().getFullYear(),
      creatorId: user.id,
      contributors: {
        create: values.contributors.map((c) => ({
          userId: c.userId || null,
          externalName: c.externalName || null,
          externalAffiliation: c.externalAffiliation || null,
          externalLink: c.externalLink || null,
          role: c.role,
          customRoleTitle: c.customRoleTitle || null,
          displayOrder: c.displayOrder,
        })),
      },
      links: {
        create: values.links.map((l) => ({
          label: l.label,
          url: l.url,
          type: l.type,
        })),
      },
      attachments: {
        create: (values.attachments || []).map((a) => ({
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })),
      },
    },
    include: {
      contributors: true,
      links: true,
      attachments: true,
    },
  });

  return { success: true, item };
}

export async function reviewShowcaseItemAction(
  itemId: string,
  payload: { action: 'PUBLISH' | 'REJECT'; reason?: string }
) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền kiểm duyệt bài.' };
  }

  const parsedInput = reviewShowcaseItemInputSchema.safeParse({ itemId, payload });
  if (!parsedInput.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  itemId = parsedInput.data.itemId;
  payload = parsedInput.data.payload;

  const isPublish = payload.action === 'PUBLISH';
  const target = await prisma.showcaseItem.findUnique({ where: { id: itemId }, select: { status: true } });
  if (isPublish && target?.status !== 'READY_FOR_APPROVAL') {
    return { success: false, error: 'Bài viết phải hoàn tất biên tập trước khi xuất bản.' };
  }
  const updated = await prisma.showcaseItem.update({
    where: { id: itemId },
    data: {
      status: isPublish ? 'PUBLISHED' : 'REJECTED',
      publishedAt: isPublish ? new Date() : undefined,
      rejectionReason: isPublish ? null : payload.reason || 'Nội dung cần chỉnh sửa bổ sung.',
      ...(isPublish ? {} : { isPinned: false, pinnedAt: null }),
    },
  });

  try {
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/reviews');
    if (updated.slug) revalidatePath(`/showcase/${updated.slug}`);
  } catch {
    // Ignore cache revalidation errors outside request context
  }

  return { success: true, status: updated.status };
}

export async function togglePinShowcaseItemAction(itemId: string) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền ghim công trình lên trang chủ.' };
  }

  const parsedItemId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedItemId.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  itemId = parsedItemId.data;

  const targetItem = await prisma.showcaseItem.findUnique({ where: { id: itemId } });
  if (!targetItem) {
    return { success: false, error: 'Không tìm thấy công trình này.' };
  }

  if (targetItem.status !== 'PUBLISHED') {
    return { success: false, error: 'Chỉ có thể ghim các công trình đã được xuất bản (PUBLISHED).' };
  }

  if (targetItem.isPinned) {
    // Unpin item
    await prisma.showcaseItem.update({
      where: { id: itemId },
      data: { isPinned: false, pinnedAt: null },
    });

    try {
      revalidatePath('/');
      revalidatePath('/admin');
      if (targetItem.slug) revalidatePath(`/showcase/${targetItem.slug}`);
    } catch {
      // Ignore in tests
    }

    return { success: true, isPinned: false, message: 'Đã bỏ ghim công trình khỏi trang chủ.' };
  }

  // Pin item: check limit 10 FIFO
  const pinnedItems = await prisma.showcaseItem.findMany({
    where: { isPinned: true, status: 'PUBLISHED' },
    orderBy: { pinnedAt: 'asc' },
  });

  if (pinnedItems.length >= 10) {
    const oldest = pinnedItems[0];
    await prisma.showcaseItem.update({
      where: { id: oldest.id },
      data: { isPinned: false, pinnedAt: null },
    });
  }

  await prisma.showcaseItem.update({
    where: { id: itemId },
    data: { isPinned: true, pinnedAt: new Date() },
  });

  try {
    revalidatePath('/');
    revalidatePath('/admin');
    if (targetItem.slug) revalidatePath(`/showcase/${targetItem.slug}`);
  } catch {
    // Ignore in tests
  }

  return { success: true, isPinned: true, message: 'Đã ghim công trình lên trang chủ.' };
}

export async function toggleItemVisibilityAction(itemId: string) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi chế độ hiển thị.' };
  }

  const parsed = toggleItemVisibilityInputSchema.safeParse({ itemId });
  if (!parsed.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  itemId = parsed.data.itemId;

  const targetItem = await prisma.showcaseItem.findUnique({
    where: { id: itemId },
    select: { id: true, visibility: true, slug: true },
  });

  if (!targetItem) {
    return { success: false, error: 'Không tìm thấy công trình này.' };
  }

  const nextVisibility = targetItem.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
  const updated = await prisma.showcaseItem.update({
    where: { id: itemId },
    data: { visibility: nextVisibility },
    select: { id: true, visibility: true, slug: true },
  });

  try {
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    if (updated.slug) revalidatePath(`/showcase/${updated.slug}`);
  } catch {
    // Ignore in tests
  }

  return { success: true, visibility: updated.visibility };
}

export async function updateShowcaseItemAction(itemId: string, input: CreateShowcaseItemInput) {
  const user = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!user) {
    return { success: false, error: 'Chỉ Thành viên nòng cốt (Core Member) và Quản trị viên mới có quyền cập nhật bài.' };
  }

  const parsedItemId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedItemId.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  itemId = parsedItemId.data;

  const parsedInput = createShowcaseItemInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  const values = parsedInput.data;

  const targetItem = await prisma.showcaseItem.findUnique({
    where: { id: itemId },
  });
  if (!targetItem) {
    return { success: false, error: 'Không tìm thấy công trình này.' };
  }

  const isAdmin = user.role === 'ADMIN';
  if (!isAdmin && targetItem.creatorId !== user.id) {
    return { success: false, error: 'Bạn không có quyền chỉnh sửa công trình này.' };
  }

  if (!isAdmin && targetItem.status === 'PUBLISHED') {
    return { success: false, error: 'Không thể chỉnh sửa công trình đã được xuất bản.' };
  }

  let newStatus = targetItem.status;
  let newRejectionReason = targetItem.rejectionReason;

  if (targetItem.status === 'REJECTED' || targetItem.status === 'DRAFT') {
    if (values.submitForReview) {
      newStatus = 'PENDING_REVIEW';
      newRejectionReason = null;
    } else {
      newStatus = 'DRAFT';
    }
  } else if (targetItem.status === 'PENDING_REVIEW') {
    if (values.submitForReview) {
      newStatus = 'PENDING_REVIEW';
    } else {
      newStatus = 'DRAFT';
    }
  }

  const updatedItem = await prisma.$transaction(async (tx) => {
    await tx.itemContributor.deleteMany({ where: { itemId } });
    await tx.itemLink.deleteMany({ where: { itemId } });
    await tx.itemAttachment.deleteMany({ where: { itemId } });

    return tx.showcaseItem.update({
      where: { id: itemId },
      data: {
        title: values.title,
        summary: values.summary,
        content: values.content,
        type: values.type,
        scope: values.scope,
        issuer: values.issuer,
        thumbnailUrl: values.thumbnailUrl,
        mediaDriveUrl: values.mediaDriveUrl !== undefined ? values.mediaDriveUrl : targetItem.mediaDriveUrl,
        tags: values.tags !== undefined ? values.tags : targetItem.tags,
        categoryId: values.categoryId !== undefined ? values.categoryId : targetItem.categoryId,
        visibility: values.visibility || targetItem.visibility,
        status: newStatus,
        rejectionReason: newRejectionReason,
        publishedYear: values.publishedYear || targetItem.publishedYear || new Date().getFullYear(),
        contributors: {
          create: values.contributors.map((c) => ({
            userId: c.userId || null,
            externalName: c.externalName || null,
            externalAffiliation: c.externalAffiliation || null,
            externalLink: c.externalLink || null,
            role: c.role,
            customRoleTitle: c.customRoleTitle || null,
            displayOrder: c.displayOrder,
          })),
        },
        links: {
          create: values.links.map((l) => ({
            label: l.label,
            url: l.url,
            type: l.type,
          })),
        },
        attachments: {
          create: (values.attachments || []).map((a) => ({
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
          })),
        },
      },
    });
  });

  try {
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/reviews');
    if (updatedItem.slug) revalidatePath(`/showcase/${updatedItem.slug}`);
  } catch {
    // Ignore in tests
  }

  return { success: true, item: { id: updatedItem.id, slug: updatedItem.slug, status: updatedItem.status } };
}
