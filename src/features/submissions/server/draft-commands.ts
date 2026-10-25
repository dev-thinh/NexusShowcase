import type { Actor } from '@/features/identity/model/session';
import { commandFailure } from '@/server/db/command-error';
import { validationFailure } from '../model/validation-result';
import { snapshotRelations } from './snapshot-relations';

import { ARTICLE_PREFIX, publicationResources } from '@/features/submissions/model/article';
import { showcaseDraftInputSchema, showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import { buildSubmissionSnapshot } from '@/features/submissions/model/snapshot-mapper';
import { saveDraftEnvelopeSchema, submissionEnvelopeSchema, type SaveDraftInput, type SubmissionInput } from '@/features/submissions/model/versioned-input';
import { canReviewItem } from '@/features/submissions/model/workflow-state';
import { prisma } from '@/server/db/prisma';
import { reportServerError } from '@/server/observability/errors';
import type { ActionResult } from '@/shared/lib/action-result';
import { slugify } from '@/shared/lib/slugify';
import { cuidSchema, showcaseItemIdSchema } from '@/shared/lib/validation';
import { Prisma } from '@prisma/client';
import { canReferenceAssets } from '@/features/assets/server/reference-access';


async function saveDraftInternal(
  user: Actor, input: SaveDraftInput,
): Promise<ActionResult<{ id: string; slug: string; status: string; reviewVersion: number }>> {
  const envelope = saveDraftEnvelopeSchema.safeParse(input);
  if (!envelope.success) return validationFailure(envelope.error);
  const { itemId, expectedReviewVersion } = envelope.data;
  const draft = showcaseDraftInputSchema.safeParse(envelope.data.draft);
  if (!draft.success) return validationFailure(draft.error);
  const normalized = isStructured(draft.data.content ?? '') ? { ...draft.data, resources: publicationResources(draft.data.content ?? '', draft.data.resources ?? []) } : draft.data;
  const parsed = showcaseDraftInputSchema.safeParse(normalized);
  if (!parsed.success) return validationFailure(parsed.error);
  const values = parsed.data;
  if (!(await canReferenceAssets(user, values))) return { success: false, code: 'FORBIDDEN', error: 'Bạn không có quyền sử dụng một tệp trong bản nháp.' };
  if (values.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: values.categoryId }, select: { slug: true } });
    if (!category || category.slug !== (values.type === 'RESEARCH_PAPER' ? 'bai-bao-khoa-hoc' : 'robotics-iot')) return { success: false, code: 'VALIDATION', error: 'Chuyên mục không khớp với loại công trình.' };
  }
  const data = {
    title: values.title, summary: values.summary, content: values.content,
    type: values.type, categoryId: values.categoryId ?? null, thumbnailUrl: values.thumbnailUrl ?? null,
    publishedYear: values.publishedYear ?? new Date().getFullYear(),
    suggestedField: values.suggestedField, customProjectType: values.customProjectType,
  };
  const { contributors, links, attachments } = snapshotRelations({ ...values, publishedYear: values.publishedYear ?? new Date().getFullYear() });
  if (!itemId) {
    const slug = `${slugify(values.title) || 'cong-trinh'}-${crypto.randomUUID().slice(0, 8)}`;
    const item = await prisma.showcaseItem.create({ data: { ...data, slug, creatorId: user.id,
      contributors: { create: contributors }, links: { create: links }, attachments: { create: attachments },
    }, select: { id: true, slug: true, status: true, reviewVersion: true } });
    return { success: true, data: item };
  }
  const parsedId = showcaseItemIdSchema.safeParse(itemId);
  if (!parsedId.success) return validationFailure(parsedId.error);
  try {
    return await prisma.$transaction(async tx => {
      const target = await tx.showcaseItem.findUnique({ where: { id: parsedId.data } });
      if (!target || target.creatorId !== user.id) return { success: false, code: 'FORBIDDEN', error: 'Bạn không có quyền sửa bài này.' } as const;
      const published = target.status === 'PUBLISHED';
      if (target.reviewVersion !== expectedReviewVersion) return { success: false, code: 'CONFLICT', error: 'Bài đã thay đổi. Vui lòng tải lại trang.' } as const;
      if (published ? ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(target.reviewStatus ?? '') : !['DRAFT', 'REVISION_REQUESTED'].includes(target.status)) return { success: false, code: 'VALIDATION', error: 'Bài đang chờ duyệt hoặc không còn được chỉnh sửa.' } as const;
      const update = await tx.showcaseItem.updateMany({ where: { id: target.id, creatorId: user.id, reviewVersion: expectedReviewVersion, status: target.status }, data: published
        ? { authorDraft: JSON.parse(JSON.stringify(values)), reviewStatus: 'DRAFT', reviewVersion: { increment: 1 } }
        : { ...data, reviewVersion: { increment: 1 } } });
      if (update.count !== 1) return { success: false, code: 'CONFLICT', error: 'Bài đã thay đổi. Vui lòng tải lại trang.' } as const;
      if (!published) {
        await tx.itemContributor.deleteMany({ where: { itemId: target.id } });
        await tx.itemLink.deleteMany({ where: { itemId: target.id } });
        await tx.itemAttachment.deleteMany({ where: { itemId: target.id } });
        await tx.showcaseItem.update({ where: { id: target.id }, data: {
          contributors: { create: contributors }, links: { create: links }, attachments: { create: attachments },
        } });
      }
      return { success: true, data: { id: target.id, slug: target.slug, status: published ? 'DRAFT' : target.status, reviewVersion: target.reviewVersion + 1 } } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return { success: false, code: 'CONFLICT', error: 'Bài vừa thay đổi. Vui lòng tải lại trang.' };
    reportServerError('draft.save', error, { itemId, actorId: user.id });
    return { success: false, code: 'INTERNAL', error: 'Không lưu được bản nháp. Vui lòng thử lại.' };
  }
}

function isStructured(content: string) { return content.startsWith(ARTICLE_PREFIX); }

async function submitDraftInternal(user: Actor, input: SubmissionInput): Promise<ActionResult<{ status: string; revisionNumber: number; reviewVersion: number }>> {
  const envelope = submissionEnvelopeSchema.safeParse(input);
  if (!envelope.success) return validationFailure(envelope.error);
  const { itemId, expectedReviewVersion } = envelope.data;
  try {
    const result = await prisma.$transaction(async tx => {
      const item = await tx.showcaseItem.findUnique({ where: { id: itemId }, include: {
        contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
      } });
      if (!item || item.creatorId !== user.id) return { success: false, code: 'FORBIDDEN', error: 'Bạn không có quyền gửi công trình này.' } as const;
      const published = item.status === 'PUBLISHED';
      if (item.reviewVersion !== expectedReviewVersion) return { success: false, code: 'CONFLICT', error: 'Bài đã thay đổi. Vui lòng tải lại trang.' } as const;
      if (published ? !item.authorDraft || !['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(item.reviewStatus ?? '') : !['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) return { success: false, code: 'VALIDATION', error: 'Trạng thái hiện tại không thể gửi duyệt.' } as const;
      const draft = published ? showcaseDraftInputSchema.parse(item.authorDraft) : null;
      const raw = draft ?? buildSubmissionSnapshot(item);
      const valid = showcaseSubmissionInputSchema.safeParse(raw);
      if (!valid.success) return validationFailure(valid.error);
      const values = valid.data;
      if (!values.categoryId) return { success: false, code: 'VALIDATION', error: 'Vui lòng chọn chuyên mục trước khi gửi duyệt.', fieldErrors: { categoryId: ['Chọn chuyên mục.'] as string[] } } as const;
      const category = await tx.category.findUnique({ where: { id: values.categoryId }, select: { slug: true } });
      if (!category || category.slug !== (values.type === 'RESEARCH_PAPER' ? 'bai-bao-khoa-hoc' : 'robotics-iot')) return { success: false, code: 'VALIDATION', error: 'Chuyên mục không khớp với loại công trình.' } as const;
      const members = await tx.user.findMany({ where: { id: { in: values.contributors.flatMap(c => c.userId ? [c.userId] : []) } }, select: { id: true, fullName: true } });
      if (values.contributors.some(c => c.userId && !members.some(m => m.id === c.userId))) return { success: false, code: 'VALIDATION', error: 'Một thành viên đóng góp không còn tồn tại.' } as const;
      const snapshot = { ...values, contributors: values.contributors.map(c => ({ ...c, displayName: members.find(m => m.id === c.userId)?.fullName ?? c.externalName ?? null })) };
      const latest = await tx.submissionRevision.aggregate({ where: { itemId: item.id }, _max: { revisionNumber: true } });
      const revisionNumber = (latest._max.revisionNumber ?? 0) + 1;
      const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: item.reviewVersion, status: item.status }, data: {
        ...(published ? { reviewStatus: 'PENDING_REVIEW' as const } : { status: 'PENDING_REVIEW' as const }), reviewVersion: { increment: 1 }, rejectionReason: null,
      } });
      if (changed.count !== 1) return { success: false, code: 'CONFLICT', error: 'Bài đã thay đổi. Vui lòng tải lại trang.' } as const;
      await tx.submissionRevision.create({ data: { itemId: item.id, revisionNumber, snapshot: JSON.parse(JSON.stringify(snapshot)), submittedById: user.id } });
      await tx.reviewComment.updateMany({ where: { itemId: item.id, status: 'OPEN', audience: 'AUTHOR' }, data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedById: user.id } });
      await tx.auditEvent.create({ data: { itemId: item.id, actorId: user.id, action: 'SUBMITTED_FOR_REVIEW', metadata: { revisionNumber, update: published } } });
      return { success: true, data: { status: 'PENDING_REVIEW', revisionNumber, reviewVersion: item.reviewVersion + 1 } } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return { success: false, code: 'CONFLICT', error: 'Bài vừa thay đổi. Vui lòng tải lại trang.' };
    reportServerError('draft.submit', error, { itemId, actorId: user.id });
    return { success: false, code: 'INTERNAL', error: 'Không gửi được bài. Vui lòng thử lại.' };
  }
}

async function withdrawDraftInternal(actor: Actor, itemId: string, reviewVersion: number) {
  if (!cuidSchema.safeParse(itemId).success || !Number.isInteger(reviewVersion) || reviewVersion < 0) return { success: false, error: 'Dữ liệu không hợp lệ.' };
  const result = await prisma.$transaction(async tx => {
    const item = await tx.showcaseItem.findUnique({ where: { id: itemId } });
    if (!item || item.creatorId !== actor.id || !canReviewItem(item) || item.reviewVersion !== reviewVersion) return { success: false, error: 'Bài đã được xử lý hoặc không thuộc tài khoản của bạn.' };
    const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion }, data: { ...(item.status === 'PUBLISHED' ? { reviewStatus: 'DRAFT' } : { status: 'DRAFT' }), reviewVersion: { increment: 1 } } });
    if (changed.count !== 1) return { success: false, error: 'Bài đã thay đổi. Vui lòng tải lại trang.' };
    await tx.auditEvent.create({ data: { itemId, actorId: actor.id, action: 'WITHDRAWN' } });
    return { success: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return result;
}

export async function saveDraftCommand(actor: Actor, input: SaveDraftInput): ReturnType<typeof saveDraftInternal> {
  try { return await saveDraftInternal(actor, input); } catch (error) { return commandFailure('draft.save', error, { actorId: actor.id }); }
}
export async function submitDraftCommand(actor: Actor, input: SubmissionInput): ReturnType<typeof submitDraftInternal> {
  try { return await submitDraftInternal(actor, input); } catch (error) { return commandFailure('draft.submit', error, { actorId: actor.id }); }
}
export async function withdrawDraftCommand(actor: Actor, itemId: string, reviewVersion: number) {
  try { return await withdrawDraftInternal(actor, itemId, reviewVersion); } catch (error) { return commandFailure('draft.withdraw', error, { itemId, actorId: actor.id }); }
}
