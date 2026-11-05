'use server';

import { getActor } from './actor';
import { invalidateIdentityChange } from './invalidation';
import { previewBulkMembers, createBulkMembers } from './bulk-member-commands';

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
