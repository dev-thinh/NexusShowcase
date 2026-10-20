'use server';

import { auth } from '@/lib/auth';
import { canUserUpload } from '@/lib/permissions';
import { detectFileType, verifiedFileTypes } from '@/lib/file-signatures';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type UploadErrorCode = 'UNAUTHORIZED' | 'INVALID_FILE' | 'UPLOAD_FAILED';

export interface UploadResult {
  success: boolean;
  code?: UploadErrorCode;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export async function uploadFileAction(formData: FormData): Promise<UploadResult> {
  const session = await auth();
  if (!session?.user || !canUserUpload(session.user as any)) {
    return {
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Chỉ Thành viên nòng cốt và Quản trị viên mới có quyền tải tệp lên hệ thống.',
    };
  }

  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string; // 'thumbnail' | 'pdf' | 'resource'

  if (!file || typeof file === 'string' || file.size === 0) {
    return { success: false, code: 'INVALID_FILE', error: 'Vui lòng chọn một tệp hợp lệ.' };
  }

  const isThumbnail = type === 'thumbnail';
  const isPdf = type === 'pdf';
  const isResource = type === 'resource';

  if (!isThumbnail && !isPdf && !isResource) {
    return { success: false, code: 'INVALID_FILE', error: 'Loại tệp không được hỗ trợ.' };
  }

  const maxBytes = isThumbnail ? 5 * 1024 * 1024 : 25 * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      success: false,
      code: 'INVALID_FILE',
      error: `Kích thước tệp quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Giới hạn tối đa là ${
        isThumbnail ? '5MB' : '25MB'
      }.`,
    };
  }

  if (isResource) {
    // General resources are stored outside public/ and always served as downloads.
    const extension = path.extname(file.name).slice(1).toLowerCase();
    const storedExtension = /^[a-z0-9]{1,16}$/.test(extension) ? extension : 'bin';
    const storedFileName = `${crypto.randomUUID()}.${storedExtension}`;
    try {
      const directory = path.join(process.cwd(), 'storage', 'resources');
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, storedFileName), Buffer.from(await file.arrayBuffer()));
      return {
        success: true,
        url: `/uploads/resources/${storedFileName}`,
        fileName: path.basename(file.name).replace(/[\r\n]/g, '').slice(0, 160) || `resource.${storedExtension}`,
        fileSize: file.size,
        mimeType: 'application/octet-stream',
      };
    } catch {
      return { success: false, code: 'UPLOAD_FAILED', error: 'Không lưu được tài nguyên. Vui lòng thử lại.' };
    }
  }

  const validMimes = isThumbnail
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf'];

  if (!validMimes.includes(file.type)) {
    return {
      success: false,
      code: 'INVALID_FILE',
      error: isThumbnail
        ? 'Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG hoặc WebP.'
        : 'Chỉ chấp nhận tệp tài liệu định dạng PDF.',
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const detected = detectFileType(bytes);

  if (!detected) {
    return {
      success: false,
      code: 'INVALID_FILE',
      error: 'Nội dung tệp không hợp lệ hoặc không được hỗ trợ.',
    };
  }

  if (isThumbnail && detected !== 'jpeg' && detected !== 'png' && detected !== 'webp') {
    return {
      success: false,
      code: 'INVALID_FILE',
      error: 'Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG hoặc WebP.',
    };
  }

  if (isPdf && detected !== 'pdf') {
    return {
      success: false,
      code: 'INVALID_FILE',
      error: 'Chỉ chấp nhận tệp tài liệu định dạng PDF.',
    };
  }

  const verified = verifiedFileTypes[detected];

  if (file.type !== verified.mimeType) {
    return {
      success: false,
      code: 'INVALID_FILE',
      error: 'Định dạng nội dung tệp không khớp với phần mở rộng đã khai báo.',
    };
  }

  const rawBaseName = path.parse(file.name).name.trim();
  const clientFileName = `${rawBaseName || 'file'}.${verified.extension}`;
  const safeStoredFileName = `${crypto.randomUUID()}.${verified.extension}`;
  const targetSubDir = isThumbnail ? 'thumbnails' : 'documents';
  const targetDir = path.join(process.cwd(), 'public', 'uploads', targetSubDir);

  try {
    await mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, safeStoredFileName);
    await writeFile(targetPath, Buffer.from(arrayBuffer));

    const fileUrl = `/uploads/${targetSubDir}/${safeStoredFileName}`;

    return {
      success: true,
      url: fileUrl,
      fileName: clientFileName,
      fileSize: file.size,
      mimeType: verified.mimeType,
    };
  } catch (err: any) {
    return {
      success: false,
      code: 'UPLOAD_FAILED',
      error: 'Lỗi ghi tệp trên máy chủ. Vui lòng thử lại.',
    };
  }
}
