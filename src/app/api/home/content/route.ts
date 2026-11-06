import { getActor } from '@/features/identity/server/actor';
import { homeContentSchema } from '@/features/publications/model/home-content';
import { readHomeContent, saveHomeContent } from '@/features/publications/server/home-content';
import { InvalidMutationRequest, isSameOriginMutation, readMutationJson } from '@/server/http/mutation-request';
import { reportServerError } from '@/server/observability/errors';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });

export async function GET() {
  try {
    const [content, actor] = await Promise.all([readHomeContent(), getActor(['ADMIN'])]);
    return reply({ ...content, isAdmin: !!actor });
  } catch (error) {
    reportServerError('home-content.read', error);
    return reply({ error: 'Không tải được nội dung Trang chủ. Vui lòng thử lại.' }, 500);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Yêu cầu không hợp lệ.' }, 403);
  try {
    if (!await getActor(['ADMIN'])) return reply({ error: 'Chỉ Admin được chỉnh sửa nội dung Trang chủ.' }, 403);
    const parsed = homeContentSchema.safeParse(await readMutationJson(request, 128_000));
    if (!parsed.success) return reply({ error: 'Vui lòng điền đầy đủ nội dung và kiểm tra độ dài các trường.' }, 400);
    const saved = await saveHomeContent(parsed.data);
    if (!saved) return reply({ error: 'Nội dung đã được Admin khác cập nhật. Hãy sao chép phần cần giữ rồi tải lại bản mới trước khi sửa.' }, 409);
    return reply(saved);
  } catch (error) {
    if (error instanceof InvalidMutationRequest) return reply({ error: 'Dữ liệu không hợp lệ hoặc quá lớn.' }, error.status);
    reportServerError('home-content.save', error);
    return reply({ error: 'Không lưu được nội dung. Bản đang nhập vẫn được giữ, bạn có thể thử lưu lại.' }, 500);
  }
}
