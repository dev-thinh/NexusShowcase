import { reportServerError } from '@/server/observability/errors';
import { revalidatePath } from 'next/cache';

export function invalidatePaths(paths: readonly string[]): void {
  for (const path of new Set(paths)) {
    try { revalidatePath(path); } catch (error) { reportServerError('cache.invalidate', error); }
  }
}
