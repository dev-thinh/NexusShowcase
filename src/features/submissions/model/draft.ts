import { showcaseDraftInputSchema } from '@/features/submissions/model/input';
export function getAuthorDraft(value: unknown) {
  const parsed = showcaseDraftInputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
