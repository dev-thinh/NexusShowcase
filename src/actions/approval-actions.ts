'use server';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { cuidSchema, showcaseSubmissionInputSchema } from '@/lib/action-schemas';
import { canReviewItem, getReviewSnapshot } from '@/lib/direct-review';
import { revalidatePath } from 'next/cache';

const decisionSchema = z.object({
  itemId: cuidSchema, reviewVersion: z.number().int().min(0),
  action: z.enum(['PUBLISH', 'REQUEST_REVISION', 'REJECT']),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE'),
  reason: z.string().trim().max(2000).default(''),
}).strict().refine(v => v.action === 'PUBLISH' || !!v.reason, { path: ['reason'], message: 'Vui lòng nhập lý do để tác giả biết cần xử lý gì.' });

export async function decideSubmissionAction(input: z.input<typeof decisionSchema>) {
  const actor = await getCurrentUser(['ADMIN']);
  if (!actor) return { success: false, error: 'Chỉ Admin có quyền duyệt bài.' };
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' };
  const values = parsed.data;
  try {
    const result = await prisma.$transaction(async tx => {
      const item = await tx.showcaseItem.findUnique({ where: { id: values.itemId }, include: {
        contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
        revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
      } });
      if (!item || !canReviewItem(item) || item.reviewVersion !== values.reviewVersion) return { success: false, error: 'Bản nộp đã thay đổi hoặc đã được xử lý. Vui lòng tải lại trang.' } as const;
      const published = item.status === 'PUBLISHED';
      const snapshot = getReviewSnapshot(item);
      if (values.action === 'PUBLISH') {
        const valid = showcaseSubmissionInputSchema.safeParse(snapshot);
        if (!valid.success) return { success: false, error: 'Bản nộp còn thiếu dữ liệu. Hãy yêu cầu tác giả bổ sung.' } as const;
        const categoryId = snapshot.categoryId ?? item.categoryId;
        if (!categoryId) return { success: false, error: 'Bài chưa có chuyên mục. Hãy yêu cầu tác giả bổ sung.' } as const;
        const category = await tx.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
        if (!category || !['bai-bao-khoa-hoc', 'robotics-iot'].includes(category.slug)) return { success: false, error: 'Chuyên mục không hợp lệ.' } as const;
        const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: values.reviewVersion }, data: {
          title: snapshot.title, summary: snapshot.summary, content: snapshot.content,
          type: category.slug === 'bai-bao-khoa-hoc' ? 'RESEARCH_PAPER' : 'PROJECT', categoryId,
          thumbnailUrl: snapshot.thumbnailUrl === undefined ? item.thumbnailUrl : snapshot.thumbnailUrl, publishedYear: snapshot.publishedYear,
          suggestedField: snapshot.suggestedField, customProjectType: snapshot.customProjectType,
          status: 'PUBLISHED', visibility: values.visibility, publishedAt: item.publishedAt ?? new Date(),
          authorDraft: Prisma.DbNull, reviewStatus: null, rejectionReason: null, reviewVersion: { increment: 1 },
        } });
        if (changed.count !== 1) throw new Error('Conflict');
        await tx.itemContributor.deleteMany({ where: { itemId: item.id } });
        await tx.itemLink.deleteMany({ where: { itemId: item.id } });
        await tx.itemAttachment.deleteMany({ where: { itemId: item.id } });
        await tx.showcaseItem.update({ where: { id: item.id }, data: {
          contributors: { create: snapshot.contributors.map(c => ({ userId: c.userId ?? null, externalName: c.externalName ?? null, externalAffiliation: c.externalAffiliation ?? null, externalLink: c.externalLink ?? null, role: c.role, customRoleTitle: c.customRoleTitle ?? null, displayOrder: c.displayOrder })) },
          links: { create: snapshot.resources.filter(r => r.kind === 'LINK').map(r => ({ label: r.label, url: r.url, type: r.linkType ?? 'OTHER' })) },
          attachments: { create: snapshot.resources.filter(r => r.kind !== 'LINK').map(r => ({ fileName: r.fileName ?? r.label, fileUrl: r.url, fileSize: r.fileSize ?? 0, mimeType: r.mimeType ?? (r.kind === 'IMAGE' ? 'image/webp' : 'application/pdf') })) },
        } });
      } else {
        const status = values.action === 'REJECT' ? 'REJECTED' : 'REVISION_REQUESTED';
        const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: values.reviewVersion }, data: {
          ...(published ? { reviewStatus: status } : { status, isPinned: false, pinnedAt: null }),
          rejectionReason: values.reason, reviewVersion: { increment: 1 },
        } });
        if (changed.count !== 1) throw new Error('Conflict');
        if (values.action === 'REQUEST_REVISION') await tx.reviewComment.create({ data: { itemId: item.id, revisionId: item.revisions[0]?.id, fieldKey: 'content', body: values.reason, audience: 'AUTHOR', severity: 'REQUIRED', authorId: actor.id } });
      }
      await tx.auditEvent.create({ data: { itemId: item.id, actorId: actor.id, action: values.action, metadata: { reason: values.reason, revisionId: item.revisions[0]?.id ?? null, visibility: values.visibility, update: published } } });
      return { success: true, slug: item.slug } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result.success) {
      try { for (const path of ['/', '/dashboard', '/admin', '/admin/reviews', `/admin/reviews/${values.itemId}`, `/showcase/${result.slug}`]) revalidatePath(path); } catch {}
    }
    return result;
  } catch { return { success: false, error: 'Không xử lý được vì dữ liệu vừa thay đổi. Vui lòng tải lại trang.' }; }
}

export async function withdrawSubmissionAction(itemId: string, reviewVersion: number) {
  const actor = await getCurrentUser(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false, error: 'Bạn không có quyền rút bài.' };
  if (!cuidSchema.safeParse(itemId).success || !Number.isInteger(reviewVersion) || reviewVersion < 0) return { success: false, error: 'Dữ liệu không hợp lệ.' };
  const result = await prisma.$transaction(async tx => {
    const item = await tx.showcaseItem.findUnique({ where: { id: itemId } });
    if (!item || item.creatorId !== actor.id || !canReviewItem(item) || item.reviewVersion !== reviewVersion) return { success: false, error: 'Bài đã được xử lý hoặc không thuộc tài khoản của bạn.' };
    const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion }, data: { ...(item.status === 'PUBLISHED' ? { reviewStatus: 'DRAFT' } : { status: 'DRAFT' }), reviewVersion: { increment: 1 } } });
    if (changed.count !== 1) return { success: false, error: 'Bài đã thay đổi. Vui lòng tải lại trang.' };
    await tx.auditEvent.create({ data: { itemId, actorId: actor.id, action: 'WITHDRAWN' } });
    return { success: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (result.success) { try { revalidatePath('/dashboard'); revalidatePath('/admin/reviews'); } catch {} }
  return result;
}
