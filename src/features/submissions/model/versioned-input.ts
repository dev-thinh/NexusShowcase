import { cuidSchema } from '@/shared/lib/validation';
import { z } from 'zod';

export const saveDraftEnvelopeSchema = z.object({
  itemId: cuidSchema.nullable(),
  expectedReviewVersion: z.number().int().nonnegative().optional(),
  draft: z.unknown(),
}).strict().superRefine((input, context) => {
  if (input.itemId && input.expectedReviewVersion === undefined) {
    context.addIssue({ code: 'custom', path: ['expectedReviewVersion'], message: 'Thiếu phiên bản bản nháp. Vui lòng tải lại trang.' });
  }
  if (!input.itemId && input.expectedReviewVersion !== undefined) {
    context.addIssue({ code: 'custom', path: ['expectedReviewVersion'], message: 'Bản nháp mới chưa có phiên bản.' });
  }
});
export const submissionEnvelopeSchema = z.object({
  itemId: cuidSchema,
  expectedReviewVersion: z.number().int().nonnegative(),
}).strict();
export type SaveDraftInput = z.input<typeof saveDraftEnvelopeSchema>;
export type SubmissionInput = z.input<typeof submissionEnvelopeSchema>;
