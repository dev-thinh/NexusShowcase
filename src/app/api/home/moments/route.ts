import { getActor } from '@/features/identity/server/actor';
import { momentsSaveSchema } from '@/features/publications/model/moments';
import { readSharedLibrary, saveSharedGallery } from '@/features/publications/server/photo-library';
import { reportServerError } from '@/server/observability/errors';
import { InvalidMutationRequest, isSameOriginMutation, readMutationJson } from '@/server/http/mutation-request';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });

export async function GET() {
  try {
    const [actor, { home: gallery, research }] = await Promise.all([getActor(['ADMIN']), readSharedLibrary()]);
    const isAdmin = !!actor;
    return reply({ ...gallery, photos: isAdmin ? gallery.photos : gallery.photos.filter(photo => photo.visible), isAdmin, ...(isAdmin ? { protectedSources: research.photos.map(photo => photo.src) } : {}) });
  } catch (error) {
    reportServerError('moments.read', error);
    return reply({ error: 'Không tải được ảnh. Vui lòng thử lại.' }, 500);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Yêu cầu không hợp lệ.' }, 403);
  try {
    const actor = await getActor(['ADMIN']);
    if (!actor) return reply({ error: 'Chỉ Admin được chỉnh sửa ảnh.' }, 403);
    const input = await readMutationJson(request, 64_000);
    const parsed = momentsSaveSchema.safeParse(input);
    if (!parsed.success) return reply({ error: 'Kiểm tra tiêu đề của từng ảnh (tối đa 40 ảnh).' }, 400);
    const saved = await saveSharedGallery(parsed.data, 'home');
    if (!saved.success) return reply({ error: saved.error }, saved.code === 'CONFLICT' ? 409 : 400);
    return reply(saved.data);
  } catch (error) {
    if (error instanceof InvalidMutationRequest) return reply({ error: 'Dữ liệu không hợp lệ hoặc vượt dung lượng cho phép.' }, error.status);
    reportServerError('moments.save', error);
    return reply({ error: 'Không lưu được thay đổi. Bản chỉnh sửa vẫn được giữ để thử lại.' }, 500);
  }
}
