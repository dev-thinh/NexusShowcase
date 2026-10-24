import { showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import type { EffectivePublication } from '@/features/submissions/model/snapshot';
import { z } from 'zod';

/** Persisted historical metadata is distinct from strict external mutation input. */
export function parsePublishableSnapshot(snapshot: EffectivePublication) {
  const parsed = showcaseSubmissionInputSchema.safeParse({
    title: snapshot.title, summary: snapshot.summary, content: snapshot.content,
    type: snapshot.type, categoryId: snapshot.categoryId, thumbnailUrl: snapshot.thumbnailUrl,
    publishedYear: snapshot.publishedYear, suggestedField: snapshot.suggestedField,
    customProjectType: snapshot.customProjectType, contributors: snapshot.contributors,
    resources: snapshot.resources,
  });
  if (!parsed.success) return parsed;
  const issuer = z.string().trim().max(200).nullish().safeParse(snapshot.issuer);
  if (!issuer.success) return issuer;
  const data: EffectivePublication = {
    ...parsed.data, publishedYear: parsed.data.publishedYear ?? new Date().getFullYear(),
    ...(issuer.data !== undefined ? { issuer: issuer.data } : {}),
  };
  return { success: true as const, data };
}
