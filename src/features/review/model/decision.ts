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
