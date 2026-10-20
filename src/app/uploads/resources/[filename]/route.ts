import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}$/.test(filename)) {
    return new Response('Không tìm thấy tài nguyên.', { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(process.cwd(), 'storage', 'resources', filename));
    const requestedName = new URL(request.url).searchParams.get('name');
    const label = (requestedName || filename).replace(/[\r\n/\\]/g, '').slice(0, 160);
    const extension = path.extname(filename);
    const downloadName = label.toLowerCase().endsWith(extension) ? label : `${label}${extension}`;
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="resource${extension}"; filename*=UTF-8''${encodeURIComponent(downloadName).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16)}`)}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    } });
  } catch (error) {
    return new Response('Không đọc được tài nguyên.', { status: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500 });
  }
}
