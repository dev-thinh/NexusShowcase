import type { EditorialOverrides, EffectivePublication, SubmissionSnapshot } from '@/features/submissions/model/snapshot';
import { mergeEditorialOverrides } from '@/features/submissions/model/snapshot-mapper';

export function resolveLegacySnapshot(input: { snapshot: SubmissionSnapshot; reviewVersion: number; overrides: EditorialOverrides | null }): EffectivePublication {
  return input.reviewVersion === 0 && input.overrides
    ? mergeEditorialOverrides(input.snapshot, input.overrides)
    : input.snapshot;
}
