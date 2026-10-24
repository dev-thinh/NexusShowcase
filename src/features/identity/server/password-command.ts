import { prisma } from '@/server/db/prisma';
import bcrypt from 'bcryptjs';
import { changePasswordSchema, type ChangePasswordInput } from '../model/password-input';
import type { Actor } from '../model/session';
export async function changePassword(actor: Actor, input: ChangePasswordInput) {
  const userId = actor?.id;
  if (!userId) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Bạn cần đăng nhập để thực hiện thay đổi mật khẩu.' };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, code: 'VALIDATION' as const, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, status: true, deletedAt: true },
  });

  if (!user || user.status !== 'ACTIVE' || user.deletedAt || !user.passwordHash) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Không tìm thấy tài khoản hoặc tài khoản không hoạt động.' };
  }

  const isCurrentMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentMatch) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Mật khẩu hiện tại không chính xác.' };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
    },
  });

  return { success: true as const, data: { message: 'Đổi mật khẩu thành công.' } };
}
