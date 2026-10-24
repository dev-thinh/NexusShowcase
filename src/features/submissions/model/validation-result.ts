import type { ActionResult } from '@/shared/lib/action-result';
import type { ZodError } from 'zod';

export function validationFailure(error: ZodError): ActionResult<never> {
  const fieldErrors = Object.fromEntries(Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])));
  return { success: false, code: 'VALIDATION', error: 'Vui lòng kiểm tra các trường được đánh dấu.', fieldErrors };
}
