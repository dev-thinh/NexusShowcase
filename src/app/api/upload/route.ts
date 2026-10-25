import { uploadFileAction } from '@/features/assets/server/actions';
import { getActor } from '@/features/identity/server/actor';
import { consumeRateLimit } from '@/features/identity/server/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginMutation } from '@/server/http/mutation-request';

// Allow the largest supported file (25 MiB) plus multipart headers/fields.
const maxBodyBytes = 26 * 1024 * 1024;
const tooLarge = () => NextResponse.json({ error: 'Dữ liệu tải lên quá lớn.', code: 'VALIDATION' }, { status: 413 });

export async function POST(req: NextRequest) {
  try {
    const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
    if (!actor) {
      return NextResponse.json({ error: 'Chỉ thành viên nòng cốt và Admin được tải tệp.', code: 'UNAUTHORIZED' }, { status: 403 });
    }
    const throttle = await consumeRateLimit({ scope: 'upload-request', key: actor.id, limit: 60, windowMs: 60_000 });
    if (!throttle.allowed) return NextResponse.json({ error: 'Bạn tải tệp quá nhanh. Vui lòng thử lại sau.', code: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } });
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Nguồn yêu cầu không hợp lệ.', code: 'FORBIDDEN' }, { status: 403 });
    if (Number(req.headers.get('content-length')) > maxBodyBytes) return tooLarge();
    if (!req.body) return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.', code: 'VALIDATION' }, { status: 400 });
    let bytes = 0;
    let oversized = false;
    const body = req.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > maxBodyBytes) {
          oversized = true;
          controller.error(new Error('Upload body limit exceeded'));
          return;
        }
        controller.enqueue(chunk);
      },
    }));
    let formData: FormData;
    try {
      formData = await new Response(body, { headers: { 'Content-Type': req.headers.get('content-type') ?? '' } }).formData();
    } catch {
      if (oversized) return tooLarge();
      return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.', code: 'VALIDATION' }, { status: 400 });
    }
    const result = await uploadFileAction(formData);

    if (!result.success) {
      const status =
        result.code === 'RATE_LIMITED' ? 429 : result.code === 'UNAUTHORIZED' || result.code === 'FORBIDDEN'
          ? 403
          : result.code === 'INTERNAL'
          ? 500
          : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: 'Lỗi xử lý tệp tin tải lên.', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
