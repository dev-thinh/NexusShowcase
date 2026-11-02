import { reportServerError } from '@/server/observability/errors';
import { revalidatePath } from 'next/cache';

export function invalidatePaths(paths: readonly string[], type?: 'page' | 'layout'): void {
  for (const path of new Set(paths)) {
    try { if (type) revalidatePath(path, type); else revalidatePath(path); } catch (error) { reportServerError('cache.invalidate', error); }
  }
}
