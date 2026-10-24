import { getActor } from '@/features/identity/server/actor';
import { researchImagesSchema } from '@/features/publications/model/research-images';
import { momentsSaveSchema } from '@/features/publications/model/moments';
import { readSharedLibrary, saveSharedGallery } from '@/features/publications/server/photo-library';
import { reportServerError } from '@/server/observability/errors';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });

export async function GET() {
  try {
    const [actor, { home, research: gallery }] = await Promise.all([getActor(['ADMIN']), readSharedLibrary()]);
    const isAdmin = !!actor;
    return reply({ ...gallery, photos: isAdmin ? gallery.photos : gallery.photos.filter(photo => photo.visible), isAdmin, ...(isAdmin ? { library: home } : {}) });
  } catch (error) {
    reportServerError('research-images.read', error);
    return reply({ error: 'Không tải được ảnh. Vui lòng thử lại.' }, 500);
  }
}

export async function PUT(request: Request) {
  const origin = request.headers.get('origin');
  // Next may construct request.url with its internal hostname. Compare the
  // browser origin to the incoming Host instead, including its public port.
  if (origin) {
    try {
      const source = new URL(origin);
      const host = request.headers.get('host') ?? new URL(request.url).host;
      if (!['http:', 'https:'].includes(source.protocol) || source.host !== host.toLowerCase()) return reply({ error: 'Yêu cầu không hợp lệ.' }, 403);
    } catch { return reply({ error: 'Yêu cầu không hợp lệ.' }, 403); }
  }
  try {
    const actor = await getActor(['ADMIN']);
    if (!actor) return reply({ error: 'Chỉ Admin được chỉnh sửa ảnh.' }, 403);
    const body = await request.text();
    if (body.length > 64_000) return reply({ error: 'Dữ liệu ảnh quá lớn.' }, 400);
    let input: unknown;
    try { input = JSON.parse(body); } catch { return reply({ error: 'Dữ liệu không hợp lệ.' }, 400); }
    const parsed = researchImagesSchema.safeParse(input);
    if (!parsed.success) return reply({ error: 'Kiểm tra tiêu đề và vị trí của ảnh (tối đa 3 ảnh).' }, 400);
    const libraryInput = (input as { library?: unknown }).library;
    const library = libraryInput === undefined ? undefined : momentsSaveSchema.safeParse(libraryInput);
    if (library && !library.success) return reply({ error: 'Thư viện ảnh không hợp lệ (tối đa 40 ảnh).' }, 400);
    const saved = await saveSharedGallery(parsed.data, 'research', library?.data);
    if (!saved.success) return reply({ error: saved.error }, saved.code === 'CONFLICT' ? 409 : 400);
    return reply(saved.data);
  } catch (error) {
    reportServerError('research-images.save', error);
    return reply({ error: 'Không lưu được thay đổi. Bản chỉnh sửa vẫn được giữ để thử lại.' }, 500);
  }
}
