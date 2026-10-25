import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(3, 'Tên đăng nhập cần ít nhất 3 ký tự.').max(254, 'Tên đăng nhập quá dài.'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự.'),
});
