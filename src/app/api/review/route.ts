import { decideSubmissionAction } from '@/features/review/server/actions';
import type { ActionResult } from '@/shared/lib/action-result';

export const runtime = 'nodejs';
const maximumBytes = 16 * 1024;
const failure = (status: number, code: 'FORBIDDEN' | 'VALIDATION', error: string) => Response.json({ success: false, code, error } satisfies ActionResult<never>, { status });

export async function POST(request: Request) {
  const expectedOrigin = new URL(process.env.AUTH_URL || process.env.NEXTAUTH_URL || request.url).origin;
  if (request.headers.get('origin') !== expectedOrigin) return failure(403, 'FORBIDDEN', 'Nguồn yêu cầu không hợp lệ.');
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) return failure(415, 'VALIDATION', 'Yêu cầu phải dùng JSON.');
  let input: unknown;
  try {
    if (!request.body) return failure(400, 'VALIDATION', 'Dữ liệu không hợp lệ.');
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0, body = '';
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > maximumBytes) {
          await reader.cancel();
          return failure(413, 'VALIDATION', 'Yêu cầu vượt dung lượng cho phép.');
        }
        body += decoder.decode(chunk.value, { stream: true });
      }
    } finally { reader.releaseLock(); }
    input = JSON.parse(body + decoder.decode());
  } catch { return failure(400, 'VALIDATION', 'Dữ liệu không hợp lệ.'); }
  const result = await decideSubmissionAction(input);
  const status = result.success ? 200 : { VALIDATION: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, RATE_LIMITED: 429, INTERNAL: 500 }[result.code];
  return Response.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
}
