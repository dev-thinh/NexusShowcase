'use server';
import { memberLifecycleSearchSchema } from '../model/member-lifecycle';
import { searchLifecycleMembers } from './bulk-member-queries';
import { commandFailure } from '@/server/db/command-error';
import { resetBulkMemberPasswords } from './bulk-password-reset';
import { getActor } from './actor';
import { manageMemberAccounts } from './member-lifecycle';
import { invalidateIdentityChange } from './invalidation';
import { invalidatePaths } from '@/server/cache/invalidation';

export async function manageMemberAccountsAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ quản trị viên được quản lý tài khoản.' };
  const result = await manageMemberAccounts(actor, input);
  if (result.success) {
    invalidateIdentityChange(result.data.ids);
    invalidatePaths(['/works/[slug]'], 'page');
    invalidatePaths(['/admin/works', '/admin/reviews', '/research', '/projects']);
  }
  return result;
}

export async function searchLifecycleMembersAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ quản trị viên được quản lý tài khoản.' };
  const parsed = memberLifecycleSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: 'Điều kiện tìm kiếm không hợp lệ.' };
  try { return { success: true as const, data: await searchLifecycleMembers(actor.id, parsed.data) }; }
  catch (error) { return commandFailure('member.lifecycle-search', error, { actorId: actor.id }); }
}

export async function resetBulkMemberPasswordsAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ quản trị viên được quản lý tài khoản.' };
  const result = await resetBulkMemberPasswords(actor, input);
  if (result.success) invalidateIdentityChange(result.data.credentials.map(row => row.id));
  return result;
}
