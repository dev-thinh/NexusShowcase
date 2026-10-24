import { readStoredAsset } from '@/features/assets/server/delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(filename)) return new Response('Không tìm thấy tài liệu.', { status: 404 });
  try {
    const bytes = await readStoredAsset(`/uploads/documents/${filename}`);
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    } });
  } catch (error) {
    return new Response('Không đọc được tài liệu.', { status: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500 });
  }
}
