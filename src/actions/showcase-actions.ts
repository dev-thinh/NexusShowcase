'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { slugify } from '@/lib/slugify';
import {
  INVALID_ACTION_INPUT_ERROR,
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
import { ARTICLE_PREFIX, publicationResources } from '@/lib/article-content';
import type { ZodError } from 'zod';

export type { AttachmentInput, ContributorInput, CreateShowcaseItemInput, LinkInput };

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function validationFailure(error: ZodError): ActionResult<never> {
  const fieldErrors = Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))
  );
  return { success: false, error: 'Vui lòng kiểm tra các trường được đánh dấu.', fieldErrors };
}

export async function saveShowcaseDraftAction(
  itemId: string | null,
  input: ShowcaseDraftInput
): Promise<ActionResult<{ id: string; slug: string; status: string }>> {
  const user = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!user) return { success: false, error: 'Bạn không có quyền lưu bản nháp.' };
  const normalized = isStructured(input.content ?? '') ? { ...input, resources: publicationResources(input.content ?? '', input.resources ?? []) } : input;
  const parsed = showcaseDraftInputSchema.safeParse(normalized);
  if (!parsed.success) return validationFailure(parsed.error);
  const values = parsed.data;
  if (values.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: values.categoryId }, select: { slug: true } });
    if (!category || category.slug !== (values.type === 'RESEARCH_PAPER' ? 'bai-bao-khoa-hoc' : 'robotics-iot')) return { success: false, error: 'Chuyên mục không khớp với loại công trình.' };
  }
  const data = {
    title: values.title, summary: values.summary, content: values.content,
    type: values.type, categoryId: values.categoryId ?? null, thumbnailUrl: values.thumbnailUrl ?? null,
    publishedYear: values.publishedYear ?? new Date().getFullYear(),
    suggestedField: values.suggestedField, customProjectType: values.customProjectType,
  };
  const contributors = values.contributors.map(c => ({
    userId: c.userId ?? null, externalName: c.externalName ?? null, externalAffiliation: c.externalAffiliation ?? null,
    externalLink: c.externalLink ?? null, role: c.role, customRoleTitle: c.customRoleTitle ?? null, displayOrder: c.displayOrder,
  }));
  const links = values.resources.filter(r => r.kind === 'LINK').map(r => ({ label: r.label, url: r.url, type: r.linkType ?? 'OTHER' as const }));
  const attachments = values.resources.filter(r => r.kind !== 'LINK').map(r => ({ fileName: r.fileName ?? r.label, fileUrl: r.url, fileSize: r.fileSize ?? 0, mimeType: r.mimeType ?? (r.kind === 'IMAGE' ? 'image/webp' : 'application/pdf') }));
  if (!itemId) {
    const slug = `${slugify(values.title) || 'cong-trinh'}-${crypto.randomUUID().slice(0, 8)}`;
    const item = await prisma.showcaseItem.create({ data: { ...data, slug, creatorId: user.id,
      contributors: { create: contributors }, links: { create: links }, attachments: { create: attachments },
    }, select: { id: true, slug: true, status: true } });
    return { success: true, data: item };
  }
  const parsedId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedId.success) return validationFailure(parsedId.error);
  try {
    return await prisma.$transaction(async tx => {
      const target = await tx.showcaseItem.findUnique({ where: { id: parsedId.data } });
      if (!target || target.creatorId !== user.id) return { success: false, error: 'Bạn không có quyền sửa bài này.' } as const;
      const published = target.status === 'PUBLISHED';
      if (published ? ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(target.reviewStatus ?? '') : !['DRAFT', 'REVISION_REQUESTED'].includes(target.status)) return { success: false, error: 'Bài đang chờ duyệt hoặc không còn được chỉnh sửa.' } as const;
      const update = await tx.showcaseItem.updateMany({ where: { id: target.id, reviewVersion: target.reviewVersion, status: target.status }, data: published
        ? { authorDraft: JSON.parse(JSON.stringify(values)), reviewStatus: 'DRAFT', reviewVersion: { increment: 1 } }
        : { ...data, reviewVersion: { increment: 1 } } });
      if (update.count !== 1) return { success: false, error: 'Bài đã thay đổi. Vui lòng tải lại trang.' } as const;
      if (!published) {
        await tx.itemContributor.deleteMany({ where: { itemId: target.id } });
        await tx.itemLink.deleteMany({ where: { itemId: target.id } });
        await tx.itemAttachment.deleteMany({ where: { itemId: target.id } });
        await tx.showcaseItem.update({ where: { id: target.id }, data: {
          contributors: { create: contributors }, links: { create: links }, attachments: { create: attachments },
        } });
      }
      return { success: true, data: { id: target.id, slug: target.slug, status: published ? 'DRAFT' : target.status } } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch { return { success: false, error: 'Không lưu được vì bài vừa thay đổi. Vui lòng thử lại.' }; }
}

function isStructured(content: string) { return content.startsWith(ARTICLE_PREFIX); }

export async function submitShowcaseForReviewAction(itemId: string): Promise<ActionResult<{ status: string; revisionNumber: number }>> {
  const user = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!user) return { success: false, error: 'Bạn không có quyền gửi duyệt.' };
  const parsedId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedId.success) return validationFailure(parsedId.error);
  try {
    const result = await prisma.$transaction(async tx => {
      const item = await tx.showcaseItem.findUnique({ where: { id: parsedId.data }, include: {
        contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
      } });
      if (!item || item.creatorId !== user.id) return { success: false, error: 'Bạn không có quyền gửi công trình này.' } as const;
      const published = item.status === 'PUBLISHED';
      if (published ? !item.authorDraft || !['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(item.reviewStatus ?? '') : !['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) return { success: false, error: 'Trạng thái hiện tại không thể gửi duyệt.' } as const;
      const draft = published ? showcaseDraftInputSchema.parse(item.authorDraft) : null;
      const raw = draft ?? buildSubmissionSnapshot(item);
      const valid = showcaseSubmissionInputSchema.safeParse(raw);
      if (!valid.success) return validationFailure(valid.error);
      const values = valid.data;
      if (!values.categoryId) return { success: false, error: 'Vui lòng chọn chuyên mục trước khi gửi duyệt.', fieldErrors: { categoryId: ['Chọn chuyên mục.'] as string[] } } as const;
      const category = await tx.category.findUnique({ where: { id: values.categoryId }, select: { slug: true } });
      if (!category || category.slug !== (values.type === 'RESEARCH_PAPER' ? 'bai-bao-khoa-hoc' : 'robotics-iot')) return { success: false, error: 'Chuyên mục không khớp với loại công trình.' } as const;
      const members = await tx.user.findMany({ where: { id: { in: values.contributors.flatMap(c => c.userId ? [c.userId] : []) } }, select: { id: true, fullName: true } });
      if (values.contributors.some(c => c.userId && !members.some(m => m.id === c.userId))) return { success: false, error: 'Một thành viên đóng góp không còn tồn tại.' } as const;
      const snapshot = { ...values, contributors: values.contributors.map(c => ({ ...c, displayName: members.find(m => m.id === c.userId)?.fullName ?? c.externalName ?? null })) };
      const latest = await tx.submissionRevision.aggregate({ where: { itemId: item.id }, _max: { revisionNumber: true } });
      const revisionNumber = (latest._max.revisionNumber ?? 0) + 1;
      const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: item.reviewVersion, status: item.status }, data: {
        ...(published ? { reviewStatus: 'PENDING_REVIEW' as const } : { status: 'PENDING_REVIEW' as const }), reviewVersion: { increment: 1 }, rejectionReason: null,
      } });
      if (changed.count !== 1) return { success: false, error: 'Bài đã thay đổi. Vui lòng tải lại trang.' } as const;
      await tx.submissionRevision.create({ data: { itemId: item.id, revisionNumber, snapshot: JSON.parse(JSON.stringify(snapshot)), submittedById: user.id } });
      await tx.reviewComment.updateMany({ where: { itemId: item.id, status: 'OPEN', audience: 'AUTHOR' }, data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedById: user.id } });
      await tx.auditEvent.create({ data: { itemId: item.id, actorId: user.id, action: 'SUBMITTED_FOR_REVIEW', metadata: { revisionNumber, update: published } } });
      return { success: true, data: { status: 'PENDING_REVIEW', revisionNumber } } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    try { revalidatePath('/dashboard'); revalidatePath('/admin/reviews'); } catch {}
    return result;
  } catch { return { success: false, error: 'Không gửi được bài. Vui lòng tải lại trang và thử lại.' }; }
}

export async function createShowcaseItemAction(_input: CreateShowcaseItemInput) {
  return { success: false, error: 'Vui lòng dùng workspace soạn thảo để lưu và gửi duyệt.' };
}

export async function reviewShowcaseItemAction(
  itemId: string,
  payload: { action: 'PUBLISH' | 'REJECT'; reason?: string }
) {
  return { success: false, error: 'Vui lòng duyệt bản nộp trong trang phê duyệt.' };
}

export type PinActionResult = {
  success: boolean;
  isPinned?: boolean;
  error?: string;
  message?: string;
  requiresReplacement?: boolean;
  pinnedItems?: Array<{ id: string; title: string }>;
};

export async function togglePinShowcaseItemAction(itemId: string): Promise<PinActionResult> {
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
      revalidatePath('/category/bai-bao-khoa-hoc');
      revalidatePath('/category/robotics-iot');
      if (targetItem.slug) revalidatePath(`/showcase/${targetItem.slug}`);
    } catch {
      // Ignore in tests
    }

    return { success: true, isPinned: false, message: 'Đã bỏ ghim công trình khỏi trang chủ.' };
  }

  // Keep the capacity check and write atomic across simultaneous admin requests.
  try {
    const result = await prisma.$transaction(async tx => {
      const pinnedCount = await tx.showcaseItem.count({
        where: { isPinned: true, status: 'PUBLISHED' },
      });
      if (pinnedCount >= 3) {
        const pinnedItems = await tx.showcaseItem.findMany({
          where: { isPinned: true, status: 'PUBLISHED' },
          select: { id: true, title: true },
          orderBy: [{ pinnedAt: 'desc' }, { id: 'asc' }],
        });
        return { requiresReplacement: true as const, pinnedItems };
      }
      await tx.showcaseItem.update({
        where: { id: itemId },
        data: { isPinned: true, pinnedAt: new Date() },
      });
      return null;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result) {
      return { success: false, ...result, error: 'Chỉ được ghim tối đa 3 công trình. Chọn một bài đang ghim để thay thế.' };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { success: false, error: 'Danh sách ghim vừa được cập nhật. Vui lòng tải lại và thử lại.' };
    }
    throw error;
  }

  try {
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/category/bai-bao-khoa-hoc');
    revalidatePath('/category/robotics-iot');
    if (targetItem.slug) revalidatePath(`/showcase/${targetItem.slug}`);
  } catch {
    // Ignore in tests
  }

  return { success: true, isPinned: true, message: 'Đã ghim công trình lên trang chủ.' };
}

export async function replacePinnedShowcaseItemAction(itemId: string, replacedItemId: string): Promise<PinActionResult> {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền thay thế công trình ghim.' };
  if (!showcaseItemIdSchema.safeParse(itemId).success || !showcaseItemIdSchema.safeParse(replacedItemId).success || itemId === replacedItemId) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const target = await tx.showcaseItem.findUnique({ where: { id: itemId } });
      const replaced = await tx.showcaseItem.findUnique({ where: { id: replacedItemId } });
      if (!target || target.status !== 'PUBLISHED') return { success: false as const, error: 'Công trình mới không còn khả dụng để ghim.' };
      if (target.isPinned) return { success: false as const, error: 'Công trình này đã được ghim. Vui lòng tải lại danh sách.' };
      if (!replaced?.isPinned || replaced.status !== 'PUBLISHED') return { success: false as const, error: 'Bài bạn chọn không còn được ghim. Đóng hộp thoại và thử ghim lại để cập nhật danh sách.' };
      const count = await tx.showcaseItem.count({ where: { isPinned: true, status: 'PUBLISHED' } });
      if (count > 3) return { success: false as const, error: 'Danh sách cũ đang có hơn 3 bài ghim. Vui lòng bỏ ghim bớt trước khi thay thế.' };
      await tx.showcaseItem.update({ where: { id: replacedItemId }, data: { isPinned: false, pinnedAt: null } });
      await tx.showcaseItem.update({ where: { id: itemId }, data: { isPinned: true, pinnedAt: new Date() } });
      return { success: true as const, slugs: [target.slug, replaced.slug] };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!result.success) return result;
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/category/bai-bao-khoa-hoc');
    revalidatePath('/category/robotics-iot');
    for (const slug of result.slugs) revalidatePath(`/showcase/${slug}`);
    return { success: true, isPinned: true, message: 'Đã thay thế công trình nổi bật.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { success: false, error: 'Danh sách ghim vừa thay đổi. Đóng hộp thoại và thử lại.' };
    }
    throw error;
  }
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
    revalidatePath('/category/bai-bao-khoa-hoc');
    revalidatePath('/category/robotics-iot');
    if (updated.slug) revalidatePath(`/showcase/${updated.slug}`);
  } catch {
    // Ignore in tests
  }

  return { success: true, visibility: updated.visibility };
}

export async function updateShowcaseItemAction(itemId: string, input: CreateShowcaseItemInput) {
  return { success: false, error: 'Vui lòng dùng workspace soạn thảo để cập nhật bài.' };
}
