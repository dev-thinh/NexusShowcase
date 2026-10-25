import { cuidSchema } from '@/shared/lib/validation';
import { z } from 'zod';

export const decisionSchema = z.object({
  itemId: cuidSchema,
  reviewVersion: z.number().int().min(0),
  action: z.enum(['PUBLISH', 'REQUEST_REVISION', 'REJECT']),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE'),
  reason: z.string().trim().max(2000).default(''),
}).strict().refine(value => value.action === 'PUBLISH' || !!value.reason, { path: ['reason'], message: 'Vui lòng nhập lý do để tác giả biết cần xử lý gì.' });
export type DecisionInput = z.input<typeof decisionSchema>;
export const reviewFeedbackSchema = z.object({ reason: z.string().trim().min(1, 'Vui lòng nhập nội dung phản hồi.').max(2000, 'Phản hồi không được vượt quá 2000 ký tự.') });
