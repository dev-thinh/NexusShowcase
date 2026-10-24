'use server';
import type { Role } from '@prisma/client';
import { createMemberInputSchema, deleteMemberInputSchema, userRoleUpdateInputSchema, type CreateMemberInput } from '../model/member-input';
import { getActor } from './actor';
import { invalidateIdentityChange } from './invalidation';
import { createMember, disableMember, updateMemberRole } from './member-commands';
export type { CreateMemberInput } from '../model/member-input';
const unauthorized = () => ({ success: false as const, code: 'UNAUTHORIZED' as const, error: 'Chỉ Quản trị viên (Admin) mới có quyền quản lý tài khoản.' });
const invalid = () => ({ success: false as const, code: 'VALIDATION' as const, error: 'Thông tin tài khoản không hợp lệ.' });
export async function createMemberAction(input: CreateMemberInput) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  const parsed = createMemberInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const result = await createMember(actor, parsed.data);
  if (result.success) invalidateIdentityChange([result.data.user.id]);
  return result;
}
export async function updateUserRoleAction(targetUserId: string, newRole: Role) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  const parsed = userRoleUpdateInputSchema.safeParse({ targetUserId, newRole });
  if (!parsed.success) return invalid();
  const result = await updateMemberRole(actor, parsed.data);
  if (result.success) invalidateIdentityChange([targetUserId]);
  return result;
}
export async function deleteMemberAction(targetUserId: string) {
  const actor = await getActor(['ADMIN']);
  if (!actor) return unauthorized();
  const parsed = deleteMemberInputSchema.safeParse({ targetUserId });
  if (!parsed.success) return invalid();
  const result = await disableMember(actor, targetUserId);
  if (result.success) invalidateIdentityChange([targetUserId]);
  return result;
}
