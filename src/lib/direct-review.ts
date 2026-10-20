import type { Prisma } from '@prisma/client';
import { showcaseDraftInputSchema } from '@/lib/action-schemas';
import { buildSubmissionSnapshot, mergeEditorialOverrides } from '@/lib/submission-snapshot';
import type { SubmissionSnapshot, SubmissionSnapshotSource } from '@/lib/submission-types';

export const pendingReviewWhere: Prisma.ShowcaseItemWhereInput = {
  OR: [{ status: { in: ['PENDING_REVIEW', 'READY_FOR_APPROVAL'] } }, { status: 'PUBLISHED', reviewStatus: 'PENDING_REVIEW' }],
};
export function canReviewItem(item: { status: string; reviewStatus?: string | null }) {
  return ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.status) || item.status === 'PUBLISHED' && item.reviewStatus === 'PENDING_REVIEW';
}
export function getReviewSnapshot(item: SubmissionSnapshotSource & {
  reviewVersion?: number;
  revisions?: Array<{ snapshot: unknown }>;
  editorialDraft?: { overrides: unknown } | null;
}): SubmissionSnapshot {
  const snapshot = item.revisions?.[0]?.snapshot as SubmissionSnapshot | undefined;
  if (!snapshot) return buildSubmissionSnapshot(item);
  // Preserve completed legacy editorial work; new submissions never apply editorial overrides.
  if (!item.reviewVersion && item.editorialDraft) return mergeEditorialOverrides(snapshot, (item.editorialDraft.overrides ?? {}) as object);
  return snapshot;
}
export function getAuthorDraft(value: unknown) {
  const parsed = showcaseDraftInputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
