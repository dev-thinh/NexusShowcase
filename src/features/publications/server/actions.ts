'use server';
import { getActor } from '@/features/identity/server/actor';
import { invalidatePublicationChange } from './invalidation';
import { setPublicationLifecycle, setPublicationPin, setPublicationVisibility } from './state-commands';
export async function setShowcasePinAction(input: { itemId: string; enabled: boolean; replaceItemIds?: string[] }): ReturnType<typeof setPublicationPin> {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false, code: 'UNAUTHORIZED' as const, error: 'Chỉ Quản trị viên được ghim bài.' };
  const result = await setPublicationPin(actor, input);
  if (result.success) invalidatePublicationChange({ slugs: result.data.slugs, memberIds: [], kind: 'PUBLICATION' });
  return result;
}
export async function setShowcaseVisibilityAction(input: { itemId: string; visibility: 'PUBLIC' | 'PRIVATE' }): ReturnType<typeof setPublicationVisibility> {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false, code: 'UNAUTHORIZED' as const, error: 'Chỉ Quản trị viên được đổi hiển thị.' };
  const result = await setPublicationVisibility(actor, input);
  if (result.success) invalidatePublicationChange({ slugs: result.data.slugs, memberIds: [], kind: 'PUBLICATION' });
  return result;
}

async function lifecycle(itemId: string, action: 'REOPEN' | 'ARCHIVE') {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ Admin có quyền thực hiện thao tác này.' };
  const result = await setPublicationLifecycle(actor, { itemId, action });
  if (result.success) invalidatePublicationChange({ slugs: [result.data.slug], memberIds: result.data.memberIds, kind: 'PUBLICATION' });
  return result;
}
export async function reopenShowcaseAction(itemId: string) { return lifecycle(itemId, 'REOPEN'); }
export async function archiveShowcaseAction(itemId: string) { return lifecycle(itemId, 'ARCHIVE'); }
