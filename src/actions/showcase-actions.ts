'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { slugify } from '@/lib/slugify';
import {
  createShowcaseItemInputSchema,
  INVALID_ACTION_INPUT_ERROR,
  reviewShowcaseItemInputSchema,
  showcaseItemIdSchema,
  type AttachmentInput,
  type ContributorInput,
  type CreateShowcaseItemInput,
  type LinkInput,
} from '@/lib/action-schemas';
import { revalidatePath } from 'next/cache';

export type { AttachmentInput, ContributorInput, CreateShowcaseItemInput, LinkInput };

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

  const isAdmin = user.role === 'ADMIN';
  const status = values.submitForReview
    ? (isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW')
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
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      publishedYear: values.publishedYear,
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
      newStatus = isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW';
      newRejectionReason = null;
    } else {
      newStatus = 'DRAFT';
    }
  } else if (targetItem.status === 'PENDING_REVIEW') {
    if (values.submitForReview) {
      newStatus = isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW';
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
        status: newStatus,
        rejectionReason: newRejectionReason,
        publishedYear: values.publishedYear,
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
