import type { Prisma } from '@prisma/client';
export const pendingReviewWhere: Prisma.ShowcaseItemWhereInput = {
  OR: [{ status: { in: ['PENDING_REVIEW', 'READY_FOR_APPROVAL'] } }, { status: 'PUBLISHED', reviewStatus: 'PENDING_REVIEW' }],
};
