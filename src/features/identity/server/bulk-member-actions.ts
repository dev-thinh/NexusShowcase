'use server';

import { getActor } from './actor';
import { invalidateIdentityChange } from './invalidation';
import { previewBulkMembers, createBulkMembers, grantBulkMembers } from './bulk-member-commands';
import { searchGrantMembers } from './bulk-member-queries';
import { memberGrantSearchSchema } from '../model/bulk-members';
import { commandFailure } from '@/server/db/command-error';

const unauthorized = () => ({ success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ quản trị viên được quản lý tài khoản hàng loạt.' });
export async function previewBulkMembersAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  return previewBulkMembers(actor, input);
}
export async function createBulkMembersAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  const result = await createBulkMembers(actor, input);
  if (result.success) invalidateIdentityChange(result.data.flatMap(row => row.userId ? [row.userId] : []));
  return result;
}
export async function searchGrantMembersAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  const parsed = memberGrantSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: 'Điều kiện tìm kiếm không hợp lệ.' };
  try { return { success: true as const, data: await searchGrantMembers(parsed.data) }; }
  catch (error) { return commandFailure('member.bulk-search', error, { actorId: actor.id }); }
}
export async function grantBulkMembersAction(input: unknown) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  const result = await grantBulkMembers(actor, input);
  if (result.success) invalidateIdentityChange(result.data.ids);
  return result;
}
