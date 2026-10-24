import type { EditorialOverrides, EffectivePublication, SubmissionSnapshot, SubmissionSnapshotSource } from '@/features/submissions/model/snapshot';
import { buildSubmissionSnapshot } from '@/features/submissions/model/snapshot-mapper';
import { resolveLegacySnapshot } from './legacy-snapshot';
export function getReviewSnapshot(item: SubmissionSnapshotSource & {
  reviewVersion?: number;
  revisions?: Array<{ snapshot: unknown }>;
  editorialDraft?: { overrides: unknown } | null;
}): EffectivePublication {
  const snapshot = item.revisions?.[0]?.snapshot as SubmissionSnapshot | undefined;
  if (!snapshot) return buildSubmissionSnapshot(item);
  // Preserve completed legacy editorial work; new submissions never apply editorial overrides.
  return resolveLegacySnapshot({ snapshot, reviewVersion: item.reviewVersion ?? 0, overrides: item.editorialDraft?.overrides as EditorialOverrides | null ?? null });
}
