import crypto from 'node:crypto';
import path from 'node:path';
import type { UploadKind, UploadResult } from '../model/contracts';
import { detectFileType, verifiedFileTypes } from '../model/file-signatures';
import { writeStoredAsset } from './storage';
export async function uploadAsset(file: File, type: UploadKind, ownerId?: string): Promise<UploadResult> {

  if (!file || typeof file === 'string' || file.size === 0) {
    return { success: false, code: 'VALIDATION', error: 'Vui lòng chọn một tệp hợp lệ.' };
  }

  const isThumbnail = type === 'thumbnail';
  const isPdf = type === 'pdf';
  const isResource = type === 'resource';

  if (!isThumbnail && !isPdf && !isResource) {
    return { success: false, code: 'VALIDATION', error: 'Loại tệp không được hỗ trợ.' };
  }

  const maxBytes = isThumbnail ? 5 * 1024 * 1024 : 25 * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      success: false,
      code: 'VALIDATION',
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
      const url = await writeStoredAsset('resource', storedFileName, Buffer.from(await file.arrayBuffer()), ownerId);
      return { success: true, data: { url, fileName: path.basename(file.name).replace(/[\r\n]/g, '').slice(0, 160) || `resource.${storedExtension}`, fileSize: file.size, mimeType: 'application/octet-stream' } };
    } catch {
      return { success: false, code: 'INTERNAL', error: 'Không lưu được tài nguyên. Vui lòng thử lại.' };
    }
  }

  const validMimes = isThumbnail
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf'];

  if (!validMimes.includes(file.type)) {
    return {
      success: false,
      code: 'VALIDATION',
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
      code: 'VALIDATION',
      error: 'Nội dung tệp không hợp lệ hoặc không được hỗ trợ.',
    };
  }

  if (isThumbnail && detected !== 'jpeg' && detected !== 'png' && detected !== 'webp') {
    return {
      success: false,
      code: 'VALIDATION',
      error: 'Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG hoặc WebP.',
    };
  }

  if (isPdf && detected !== 'pdf') {
    return {
      success: false,
      code: 'VALIDATION',
      error: 'Chỉ chấp nhận tệp tài liệu định dạng PDF.',
    };
  }

  const verified = verifiedFileTypes[detected];

  if (file.type !== verified.mimeType) {
    return {
      success: false,
      code: 'VALIDATION',
      error: 'Định dạng nội dung tệp không khớp với phần mở rộng đã khai báo.',
    };
  }

  const rawBaseName = path.parse(file.name).name.trim();
  const clientFileName = `${rawBaseName || 'file'}.${verified.extension}`;
  const safeStoredFileName = `${crypto.randomUUID()}.${verified.extension}`;
  try {
    const fileUrl = await writeStoredAsset(isThumbnail ? 'thumbnail' : 'pdf', safeStoredFileName, Buffer.from(arrayBuffer), ownerId);

    return { success: true, data: { url: fileUrl, fileName: clientFileName, fileSize: file.size, mimeType: verified.mimeType } };
  } catch {
    return {
      success: false,
      code: 'INTERNAL',
      error: 'Không lưu được tệp. Vui lòng thử lại.',
    };
  }
}
