import { readStoredAsset } from '@/features/assets/server/delivery';
import { getAssetAccess } from '@/features/assets/server/access';
import { readThumbnail } from '@/features/assets/server/thumbnail';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public images written after startup are not in Next's production public-file index. */
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(filename)) return new Response('Không tìm thấy ảnh.', { status: 404 });
  try {
    const localUrl = `/uploads/thumbnails/${filename}`;
    if (!(await getAssetAccess(localUrl)).allowed) return new Response('Không tìm thấy ảnh.', { status: 404, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
    const requestedWidth = new URL(request.url).searchParams.get('w');
    const width = requestedWidth === null ? null : Number(requestedWidth);
    if (width !== null && ![96, 128, 256, 384, 640, 1080].includes(width)) return new Response('Kích thước không hợp lệ.', { status: 400 });
    const bytes = width === null ? await readStoredAsset(localUrl) : await readThumbnail(localUrl, width);
    const extension = path.extname(filename).slice(1);
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': width === null ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : 'image/webp',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store', Vary: 'Cookie',
    } });
  } catch (error) {
    return new Response('Không đọc được ảnh.', { status: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500 });
  }
}
