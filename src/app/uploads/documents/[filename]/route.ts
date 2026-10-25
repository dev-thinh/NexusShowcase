import { readStoredAsset } from '@/features/assets/server/delivery';
import { getAssetAccess } from '@/features/assets/server/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(filename)) return new Response('Không tìm thấy tài liệu.', { status: 404 });
  try {
    const localUrl = `/uploads/documents/${filename}`;
    if (!(await getAssetAccess(localUrl)).allowed) return new Response('Không tìm thấy tài liệu.', { status: 404, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
    const bytes = await readStoredAsset(localUrl);
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store', Vary: 'Cookie',
    } });
  } catch (error) {
    return new Response('Không đọc được tài liệu.', { status: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500 });
  }
}
