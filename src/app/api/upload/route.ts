import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canUserUpload } from '@/lib/permissions';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canUserUpload(session.user as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string; // 'thumbnail' | 'pdf'

  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const isThumbnail = type === 'thumbnail';
  const maxBytes = isThumbnail ? 5 * 1024 * 1024 : 25 * 1024 * 1024;

  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File quá lớn. Tối đa ${isThumbnail ? '5MB' : '25MB'}` }, { status: 400 });
  }

  const validMimes = isThumbnail
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf'];

  if (!validMimes.includes(file.type)) {
    return NextResponse.json({ error: 'Định dạng file không hợp lệ' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || (isThumbnail ? 'png' : 'pdf');
  const safeFileName = `${crypto.randomUUID()}.${ext}`;
  const targetSubDir = isThumbnail ? 'thumbnails' : 'documents';
  const targetDir = path.join(process.cwd(), 'public', 'uploads', targetSubDir);

  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, safeFileName);

  const bytes = await file.arrayBuffer();
  await fs.writeFile(targetPath, Buffer.from(bytes));

  const fileUrl = `/uploads/${targetSubDir}/${safeFileName}`;

  return NextResponse.json({
    url: fileUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
}
