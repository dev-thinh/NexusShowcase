'use server';
import { getActor } from '@/features/identity/server/actor';
import { invalidatePublicationChange } from '@/features/publications/server/invalidation';
import { decisionSchema } from '../model/decision';
import { decideSubmissionCommand } from './decision-command';
export async function decideSubmissionAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ Admin có quyền duyệt bài.' };
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' };
  const result = await decideSubmissionCommand(actor, parsed.data);
  if (result.success) {
    invalidatePublicationChange({ slugs: [result.data.slug], memberIds: result.data.memberIds, kind: 'PUBLICATION' });
  }
  return result;
}
