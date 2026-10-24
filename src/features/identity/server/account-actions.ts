'use server';
import { commandFailure } from '@/server/db/command-error';
import { changePasswordSchema, type ChangePasswordInput } from '../model/password-input';
import { getActor } from './actor';
import { changePassword } from './password-command';
export type { ChangePasswordInput } from '../model/password-input';
export async function changePasswordAction(input: ChangePasswordInput) {
  const actor = await getActor(undefined, { allowPasswordChangeRequired: true });
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Bạn cần đăng nhập để đổi mật khẩu.' };
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' };
  try { return await changePassword(actor, parsed.data); } catch (error) { return commandFailure('member.password', error, { actorId: actor.id }); }
}
