import { cuidSchema, trimmedText } from '@/shared/lib/validation';
import { z } from 'zod';
export const createMemberInputSchema = z.object({
  fullName: trimmedText(200).min(1),
  email: trimmedText(254).min(1),
  studentId: trimmedText(64).optional(),
  role: z.enum(['MEMBER', 'CORE_MEMBER']).optional(),
  password: trimmedText(128).optional(),
});

export const userRoleUpdateInputSchema = z.object({
  targetUserId: cuidSchema,
  newRole: z.enum(['GUEST', 'MEMBER', 'CORE_MEMBER', 'ADMIN']),
});

export const deleteMemberInputSchema = z.object({ targetUserId: cuidSchema });


export type CreateMemberInput = z.input<typeof createMemberInputSchema>;
