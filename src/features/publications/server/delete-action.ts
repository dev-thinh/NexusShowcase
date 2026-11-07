'use server';
import { getActor } from '@/features/identity/server/actor';
import { deletePublishedPost } from './delete-command';
import { invalidatePublicationChange } from './invalidation';

export async function deletePublishedPostAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ quản trị viên được xóa bài đăng.' };
  const result = await deletePublishedPost(actor, input);
  if (result.success) invalidatePublicationChange({ ...result.data, kind: 'PUBLICATION' });
  return result;
}
