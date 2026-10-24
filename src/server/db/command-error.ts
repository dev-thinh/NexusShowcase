import { reportServerError } from '@/server/observability/errors';
import type { ActionResult } from '@/shared/lib/action-result';
import { Prisma } from '@prisma/client';

export class StateConflict extends Error {
  constructor() { super('State conflict'); this.name = 'StateConflict'; }
}

export function commandFailure(event: string, error: unknown, context?: { itemId?: string; actorId?: string }): Extract<ActionResult<never>, { success: false }> {
  if (error instanceof StateConflict || error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return { success: false, code: 'CONFLICT', error: 'Dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.' };
  }
  reportServerError(event, error, context);
  return { success: false, code: 'INTERNAL', error: 'Không xử lý được yêu cầu. Vui lòng thử lại.' };
}
