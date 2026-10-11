'use server';

import { auth } from '@/lib/auth';
import { canUserUpload } from '@/lib/permissions';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export async function uploadFileAction(formData: FormData): Promise<UploadResult> {
  const session = await auth();
  if (!session?.user || !canUserUpload(session.user as any)) {
    return { success: false, error: 'Chỉ Thành viên nòng cốt và Quản trị viên mới có quyền tải tệp lên hệ thống.' };
  }

  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string; // 'thumbnail' | 'pdf'

  if (!file || typeof file === 'string' || file.size === 0) {
    return { success: false, error: 'Vui lòng chọn một tệp hợp lệ.' };
  }

  const isThumbnail = type === 'thumbnail';
  const maxBytes = isThumbnail ? 5 * 1024 * 1024 : 25 * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      success: false,
      error: `Kích thước tệp quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Giới hạn tối đa là ${
        isThumbnail ? '5MB' : '25MB'
      }.`,
    };
  }

  const validMimes = isThumbnail
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf'];

  if (!validMimes.includes(file.type)) {
    return {
      success: false,
      error: isThumbnail
        ? 'Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG hoặc WebP.'
        : 'Chỉ chấp nhận tệp tài liệu định dạng PDF.',
    };
  }

  const ext = file.name.split('.').pop() || (isThumbnail ? 'png' : 'pdf');
  const safeFileName = `${crypto.randomUUID()}.${ext}`;
  const targetSubDir = isThumbnail ? 'thumbnails' : 'documents';
  const targetDir = path.join(process.cwd(), 'public', 'uploads', targetSubDir);

  try {
    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, safeFileName);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

    const fileUrl = `/uploads/${targetSubDir}/${safeFileName}`;

    return {
      success: true,
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (err: any) {
    console.error('File write error:', err);
    return { success: false, error: 'Lỗi ghi tệp trên máy chủ. Vui lòng thử lại.' };
  }
}
