'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự.').max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export async function changePasswordAction(input: ChangePasswordInput) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Bạn cần đăng nhập để thực hiện thay đổi mật khẩu.' };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
    return { success: false, error: 'Không tìm thấy tài khoản hoặc tài khoản không hoạt động.' };
  }

  const isCurrentMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentMatch) {
    return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
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

  return { success: true, message: 'Đổi mật khẩu thành công.' };
}
