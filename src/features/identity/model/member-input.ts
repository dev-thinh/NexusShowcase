import { cuidSchema, trimmedText } from '@/shared/lib/validation';
import { z } from 'zod';
import { bcryptPasswordByteLimit } from './password-input';
export const createMemberInputSchema = z.object({
  fullName: trimmedText(200).min(1, 'Vui lòng nhập họ và tên.'),
  email: trimmedText(254).min(1, 'Vui lòng nhập tên đăng nhập hoặc email.'),
  studentId: trimmedText(64).optional(),
  role: z.enum(['MEMBER', 'CORE_MEMBER']).optional(),
  password: trimmedText(128).refine(value => !value || value.length >= 15, 'Mật khẩu cần ít nhất 15 ký tự.').refine(bcryptPasswordByteLimit, 'Mật khẩu tối đa 72 byte UTF-8.').optional(),
});

export const userRoleUpdateInputSchema = z.object({
  targetUserId: cuidSchema,
  newRole: z.enum(['GUEST', 'MEMBER', 'CORE_MEMBER', 'ADMIN']),
});

export const deleteMemberInputSchema = z.object({ targetUserId: cuidSchema });


export type CreateMemberInput = z.input<typeof createMemberInputSchema>;
