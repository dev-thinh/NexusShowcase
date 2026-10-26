import { z } from 'zod';
// bcrypt only uses the first 72 UTF-8 bytes. Keep existing-password inputs
// unrestricted so historical credentials can still be verified and replaced.
export const bcryptPasswordByteLimit = (value: string) => new TextEncoder().encode(value).length <= 72;
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().superRefine((value, context) => {
    const messages: string[] = [];
    if (value.length < 8 || !/\p{Lu}/u.test(value) || !/[0-9]/.test(value) || !/[^\p{L}\p{N}\s]/u.test(value)) {
      messages.push('Mật khẩu mới cần ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt.');
    }
    if (!bcryptPasswordByteLimit(value)) messages.push('Mật khẩu tối đa 72 byte UTF-8.');
    if (messages.length) context.addIssue({ code: 'custom', message: messages.join(' ') });
  }),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changePasswordFormSchema = changePasswordSchema.extend({
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới.'),
}).refine(value => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp.' });
