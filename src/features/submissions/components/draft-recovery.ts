import { z } from 'zod';
import { showcaseDraftInputSchema, type ShowcaseDraftInput } from '../model/input';
import { saveDraftEnvelopeSchema } from '../model/versioned-input';

// Recovery must retain text that the server rejects (for example a title over
// its limit). Reject broken field types, but keep validation errors editable.
const recoveryData = z.custom<ShowcaseDraftInput>(value => {
  try {
    if (JSON.stringify(value).length > 2_000_000) return false;
    const parsed = showcaseDraftInputSchema.safeParse(value);
    return parsed.success || parsed.error.issues.every(issue => ['too_big', 'too_small', 'custom', 'invalid_format'].includes(issue.code));
  } catch { return false; }
});
const recoverySchema = z.object({
  format: z.literal(1), accountId: z.string(), itemId: z.string(), sessionId: z.string(),
  expectedReviewVersion: z.number().int().nonnegative(), editSequence: z.number().int().nonnegative(),
  updatedAt: z.number(), data: recoveryData,
  pendingMutation: z.object({ input: saveDraftEnvelopeSchema, editSequence: z.number().int().nonnegative() }).optional(),
});
export type DraftRecovery = z.input<typeof recoverySchema>;
type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
const prefix = 'nexus:draft-recovery:v1:';
const keyOf = (record: Pick<DraftRecovery, 'accountId' | 'itemId' | 'sessionId'>) => prefix + JSON.stringify([record.accountId, record.itemId, record.sessionId]);

export function listRecoveries(storage: StorageAccess, accountId: string, itemId: string): { records: DraftRecovery[]; error: boolean } {
  try {
    const records: DraftRecovery[] = [];
    let error = false;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(prefix)) continue;
      // Do not parse another account's records unnecessarily.
      let identity: unknown;
      try { identity = JSON.parse(key.slice(prefix.length)); } catch { continue; }
      if (!Array.isArray(identity) || identity[0] !== accountId || identity[1] !== itemId) continue;
      try {
        const parsed = recoverySchema.safeParse(JSON.parse(storage.getItem(key) ?? 'null'));
        if (parsed.success && keyOf(parsed.data) === key) records.push(parsed.data);
        else error = true;
      } catch { error = true; }
    }
    return { records: records.sort((a, b) => b.updatedAt - a.updatedAt), error };
  } catch { return { records: [], error: true }; }
}
export function writeRecovery(storage: StorageAccess, record: DraftRecovery): boolean {
  try {
    if (!recoverySchema.safeParse(record).success) return false;
    storage.setItem(keyOf(record), JSON.stringify(record)); return true;
  } catch { return false; }
}
export function removeRecovery(storage: StorageAccess, record: DraftRecovery): boolean {
  try {
    const raw = storage.getItem(keyOf(record));
    if (!raw) return true;
    const current = JSON.parse(raw) as DraftRecovery;
    if (current.editSequence !== record.editSequence || current.updatedAt !== record.updatedAt) return false;
    storage.removeItem(keyOf(record)); return true;
  } catch { return false; }
}
