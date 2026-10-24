import { z } from 'zod';
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự.').max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
