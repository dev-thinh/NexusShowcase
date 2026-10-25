export type ActionErrorCode = 'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL' | 'RATE_LIMITED';

export type ActionResult<T, Detail = never> =
  | { success: true; data: T }
  | { success: false; code: ActionErrorCode; error: string; fieldErrors?: Record<string, string[]>; details?: Detail };
