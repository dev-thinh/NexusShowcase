'use server';
import { getActor } from '@/features/identity/server/actor';
import { invalidatePublicationChange } from '@/features/publications/server/invalidation';
import { validationFailure } from '../model/validation-result';
import { saveDraftEnvelopeSchema, submissionEnvelopeSchema, type SaveDraftInput, type SubmissionInput } from '../model/versioned-input';
import { saveDraftCommand, submitDraftCommand, withdrawDraftCommand } from './draft-commands';

export async function saveShowcaseDraftAction(input: SaveDraftInput) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn không có quyền lưu bản nháp.' };
  const parsed = saveDraftEnvelopeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await saveDraftCommand(actor, parsed.data);
  if (result.success) invalidatePublicationChange({ slugs: [], memberIds: [], kind: 'SUBMISSION' });
  return result;
}
export async function submitShowcaseForReviewAction(input: SubmissionInput) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn không có quyền gửi duyệt.' };
  const parsed = submissionEnvelopeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await submitDraftCommand(actor, parsed.data);
  if (result.success) invalidatePublicationChange({ slugs: [], memberIds: [], kind: 'SUBMISSION' });
  return result;
}
export async function withdrawSubmissionAction(itemId: string, reviewVersion: number) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn không có quyền rút bài.' };
  const result = await withdrawDraftCommand(actor, itemId, reviewVersion);
  if (result.success) invalidatePublicationChange({ slugs: [], memberIds: [], kind: 'SUBMISSION' });
  return result;
}
