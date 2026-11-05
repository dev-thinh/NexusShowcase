'use client';

import type { ActionResult } from './action-result';

/** Upload outside Next's sequential Server Action queue. */
export async function uploadFile<T extends { url: string }>(data: FormData, endpoint = '/api/upload'): Promise<ActionResult<T>> {
  try {
    const response = await fetch(endpoint, { method: 'POST', body: data, signal: AbortSignal.timeout(120_000) });
    const body = await response.json();
    if (!response.ok) return {
      success: false,
      code: response.status === 429 ? 'RATE_LIMITED' : response.status === 403 ? 'FORBIDDEN' : response.status >= 500 ? 'INTERNAL' : 'VALIDATION',
      error: typeof body?.error === 'string' ? body.error : 'Không tải được tệp. Vui lòng thử lại.',
    };
    if (typeof body?.url !== 'string' || !body.url) throw new Error('Invalid upload response');
    return { success: true, data: body as T };
  } catch {
    return { success: false, code: 'INTERNAL', error: 'Không tải được tệp. Kiểm tra kết nối và thử lại.' };
  }
}
