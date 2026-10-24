import type { Actor } from '@/features/identity/model/session';
import { StateConflict, commandFailure } from '@/server/db/command-error';
import type { ActionResult } from '@/shared/lib/action-result';
import { decisionSchema } from '../model/decision';
import { applyReviewedSnapshot } from './apply-snapshot';

import { getReviewSnapshot } from '@/features/review/server/review-snapshot';
import { parsePublishableSnapshot } from './publishable-snapshot';
import { canReviewItem } from '@/features/submissions/model/workflow-state';
import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export async function decideSubmissionCommand(actor: Actor, input: z.input<typeof decisionSchema>): Promise<ActionResult<{ slug: string; memberIds: string[] }>> {
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return { success: false, code: 'FORBIDDEN', error: 'Chỉ Admin có quyền duyệt bài.' };
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' };
  const values = parsed.data;
  try {
    const result = await prisma.$transaction(async tx => {
      const item = await tx.showcaseItem.findUnique({ where: { id: values.itemId }, include: {
        contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
        revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
      } });
      if (!item || !canReviewItem(item) || item.reviewVersion !== values.reviewVersion) return { success: false, code: 'CONFLICT', error: 'Bản nộp đã thay đổi hoặc đã được xử lý. Vui lòng tải lại trang.' } as const;
      const published = item.status === 'PUBLISHED';
      const snapshot = getReviewSnapshot(item);
      let affected = { slug: item.slug, memberIds: item.contributors.flatMap(contributor => contributor.userId ? [contributor.userId] : []) };
      if (values.action === 'PUBLISH') {
        const valid = parsePublishableSnapshot(snapshot);
        if (!valid.success) return { success: false, code: 'VALIDATION', error: 'Bản nộp còn thiếu dữ liệu. Hãy yêu cầu tác giả bổ sung.' } as const;
        const categoryId = snapshot.categoryId ?? item.categoryId;
        if (!categoryId) return { success: false, code: 'VALIDATION', error: 'Bài chưa có chuyên mục. Hãy yêu cầu tác giả bổ sung.' } as const;
        const category = await tx.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
        if (!category || !['bai-bao-khoa-hoc', 'robotics-iot'].includes(category.slug)) return { success: false, code: 'VALIDATION', error: 'Chuyên mục không hợp lệ.' } as const;
        affected = await applyReviewedSnapshot(tx, { itemId: item.id, expectedReviewVersion: values.reviewVersion, snapshot: valid.data, visibility: values.visibility });
      } else {
        const status = values.action === 'REJECT' ? 'REJECTED' : 'REVISION_REQUESTED';
        const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: values.reviewVersion }, data: {
          ...(published ? { reviewStatus: status } : { status, isPinned: false, pinnedAt: null }),
          rejectionReason: values.reason, reviewVersion: { increment: 1 },
        } });
        if (changed.count !== 1) throw new StateConflict();
        if (values.action === 'REQUEST_REVISION') await tx.reviewComment.create({ data: { itemId: item.id, revisionId: item.revisions[0]?.id, fieldKey: 'content', body: values.reason, audience: 'AUTHOR', severity: 'REQUIRED', authorId: actor.id } });
      }
      await tx.auditEvent.create({ data: { itemId: item.id, actorId: actor.id, action: values.action, metadata: { reason: values.reason, revisionId: item.revisions[0]?.id ?? null, visibility: values.visibility, update: published } } });
      return { success: true, data: affected } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return result;
  } catch (error) { return commandFailure('review.decision', error, { itemId: values.itemId, actorId: actor.id }); }
}
