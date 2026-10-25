import { z } from 'zod';
// bcrypt only uses the first 72 UTF-8 bytes. Keep existing-password inputs
// unrestricted so historical credentials can still be verified and replaced.
export const bcryptPasswordByteLimit = (value: string) => new TextEncoder().encode(value).length <= 72;
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().min(15, 'Mật khẩu mới phải có tối thiểu 15 ký tự.').max(128).refine(bcryptPasswordByteLimit, 'Mật khẩu tối đa 72 byte UTF-8.'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changePasswordFormSchema = changePasswordSchema.extend({
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới.'),
}).refine(value => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp.' });
