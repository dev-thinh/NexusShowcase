'use server';

import { prisma } from '@/lib/prisma';
import { canUserUpload, canUserReview } from '@/lib/permissions';
import { slugify } from '@/lib/slugify';
import { ItemType, ItemScope, ContributorRole, LinkType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface ContributorInput {
  userId?: string | null;
  externalName?: string | null;
  externalAffiliation?: string | null;
  externalLink?: string | null;
  role: ContributorRole;
  customRoleTitle?: string | null;
  displayOrder: number;
}

export interface LinkInput {
  label: string;
  url: string;
  type: LinkType;
}

export interface AttachmentInput {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CreateShowcaseItemInput {
  title: string;
  summary: string;
  content?: string;
  type: ItemType;
  scope?: ItemScope;
  issuer?: string;
  thumbnailUrl?: string;
  publishedYear: number;
  contributors: ContributorInput[];
  links: LinkInput[];
  attachments?: AttachmentInput[];
  submitForReview?: boolean;
}

export async function createShowcaseItemAction(userId: string, input: CreateShowcaseItemInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !canUserUpload(user)) {
    return { success: false, error: 'Chỉ Thành viên nòng cốt (Core Member) và Quản trị viên mới có quyền đăng bài.' };
  }

  let slug = slugify(input.title);
  const existing = await prisma.showcaseItem.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const isAdmin = user.role === 'ADMIN';
  const status = input.submitForReview
    ? (isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW')
    : 'DRAFT';

  const item = await prisma.showcaseItem.create({
    data: {
      title: input.title,
      slug,
      summary: input.summary,
      content: input.content,
      type: input.type,
      scope: input.scope,
      issuer: input.issuer,
      thumbnailUrl: input.thumbnailUrl,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      publishedYear: input.publishedYear,
      creatorId: user.id,
      contributors: {
        create: input.contributors.map((c) => ({
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
        create: input.links.map((l) => ({
          label: l.label,
          url: l.url,
          type: l.type,
        })),
      },
      attachments: {
        create: (input.attachments || []).map((a) => ({
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
  adminId: string,
  itemId: string,
  payload: { action: 'PUBLISH' | 'REJECT'; reason?: string }
) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !canUserReview(admin)) {
    return { success: false, error: 'Chỉ Thầy chủ nhiệm (Admin) mới có quyền kiểm duyệt bài.' };
  }

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

export async function togglePinShowcaseItemAction(adminId: string, itemId: string) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !canUserReview(admin)) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền ghim công trình lên trang chủ.' };
  }

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

  return { success: true, isPinned: true, message: 'Đã ghim công trình lên trang chủ (Tối đa 10 bài).' };
}
