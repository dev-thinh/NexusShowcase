import { z } from 'zod';
import { submissionEnvelopeSchema } from '../model/versioned-input';
const attemptSchema = submissionEnvelopeSchema.extend({ mutationId: z.uuid() });
export type SubmissionAttempt = z.infer<typeof attemptSchema>;
type AttemptStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const keyFor = (accountId: string, itemId: string) => `nexus:submission-attempt:${JSON.stringify([accountId, itemId])}`;

/** Keep the same request after a lost response, including a reload of the draft. */
export function readSubmissionAttempt(storage: AttemptStorage, accountId: string, itemId: string, version: number): SubmissionAttempt | null {
  try {
    const parsed = attemptSchema.safeParse(JSON.parse(storage.getItem(keyFor(accountId, itemId)) ?? 'null'));
    return parsed.success && parsed.data.itemId === itemId && parsed.data.expectedReviewVersion === version ? parsed.data : null;
  } catch { return null; }
}
export function writeSubmissionAttempt(storage: AttemptStorage, accountId: string, attempt: SubmissionAttempt): boolean {
  try { storage.setItem(keyFor(accountId, attempt.itemId), JSON.stringify(attempt)); return true; } catch { return false; }
}
export function clearSubmissionAttempt(storage: AttemptStorage, accountId: string, attempt: SubmissionAttempt): void {
  try {
    const key = keyFor(accountId, attempt.itemId);
    const current = attemptSchema.safeParse(JSON.parse(storage.getItem(key) ?? 'null'));
    if (current.success && current.data.mutationId === attempt.mutationId) storage.removeItem(key);
  } catch { /* A retained receipt is harmless; never clear another attempt. */ }
}

/** A rejection of a retry does not disprove an earlier successful commit. */
export function mayResumeAfterSubmissionRejection(code: string, attempt: SubmissionAttempt, current: { editable: boolean; reviewVersion: number } | null): boolean {
  return code === 'VALIDATION' && current?.editable === true && current.reviewVersion === attempt.expectedReviewVersion;
}
