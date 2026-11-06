'use server';
import { prisma } from '@/server/db/prisma';
import { cuidSchema } from '@/shared/lib/validation';
import { z } from 'zod';
import { getActor } from '@/features/identity/server/actor';
import { invalidatePublicationChange } from '@/features/publications/server/invalidation';
import { validationFailure } from '../model/validation-result';
import { saveDraftEnvelopeSchema, submissionEnvelopeSchema, type SaveDraftInput, type SubmissionInput } from '../model/versioned-input';
import { deleteDraftCommand, saveDraftCommand, submitDraftCommand, withdrawDraftCommand } from './draft-commands';

export async function deleteShowcaseDraftAction(itemId: string, reviewVersion: number) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn không có quyền xóa bản nháp.' };
  const result = await deleteDraftCommand(actor, itemId, reviewVersion);
  if (result.success) invalidatePublicationChange({ slugs: [], memberIds: [], kind: 'SUBMISSION' });
  return result;
}

export async function saveShowcaseDraftAction(input: SaveDraftInput) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn không có quyền lưu bản nháp.' };
  const parsed = saveDraftEnvelopeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await saveDraftCommand(actor, parsed.data);
  // Autosave returns data only: broad invalidation would rerender the editor on every keystroke burst.
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

export async function createShowcaseDraftAction(input: { mutationId: string }) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn không có quyền tạo bản nháp.' };
  const parsed = z.object({ mutationId: z.uuid() }).strict().safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return saveDraftCommand(actor, { itemId: null, mutationId: parsed.data.mutationId, draft: {
    title: '', citationEnabled: false,
    contributors: [{ userId: actor.id, role: 'CONTRIBUTOR', displayOrder: 0 }],
  } });
}

/** Authoritative status only for the authenticated owner; no draft payload returned. */
export async function getShowcaseSubmissionStateAction(itemId: string) {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor || !cuidSchema.safeParse(itemId).success) return null;
  const item = await prisma.showcaseItem.findUnique({ where: { id: itemId }, select: { creatorId: true, status: true, reviewStatus: true, reviewVersion: true } });
  if (!item || item.creatorId !== actor.id) return null;
  const editable = item.status === 'PUBLISHED' ? !['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.reviewStatus ?? '') : ['DRAFT', 'REVISION_REQUESTED'].includes(item.status);
  return { editable, reviewVersion: item.reviewVersion };
}
