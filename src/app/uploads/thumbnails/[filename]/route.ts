import { readStoredAsset } from '@/features/assets/server/delivery';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public images written after startup are not in Next's production public-file index. */
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(filename)) return new Response('Không tìm thấy ảnh.', { status: 404 });
  try {
    const bytes = await readStoredAsset(`/uploads/thumbnails/${filename}`);
    const extension = path.extname(filename).slice(1);
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    } });
  } catch (error) {
    return new Response('Không đọc được ảnh.', { status: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500 });
  }
}
