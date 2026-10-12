import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadFileAction } from '@/actions/upload-actions';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));

const filesystem = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('fs/promises', () => filesystem);

import { auth } from '@/lib/auth';

describe('Upload File Action Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filesystem.mkdir.mockResolvedValue(undefined);
    filesystem.writeFile.mockResolvedValue(undefined);
  });

  it('rejects an unauthenticated upload', async () => {
    (auth as any).mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.png', { type: 'image/png' }));
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  });

  it('rejects an invalid declared MIME type for a thumbnail', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'core-1', role: 'CORE_MEMBER' } });
    const formData = new FormData();
    formData.append('file', new File(['test'], 'malicious.exe', { type: 'application/x-msdownload' }));
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: false, code: 'INVALID_FILE' });
  });

  it('rejects an empty or missing file', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'admin-1', role: 'ADMIN' } });
    const formData = new FormData();
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: false, code: 'INVALID_FILE' });
  });

  it('rejects an image with an allowed MIME type but a non-image signature', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'core-1', role: 'CORE_MEMBER' } });
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'avatar.jpg', { type: 'image/jpeg' }));
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: false, code: 'INVALID_FILE' });
    expect(filesystem.writeFile).not.toHaveBeenCalled();
  });

  it('rejects a PDF with an allowed MIME type but an image signature', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'core-1', role: 'CORE_MEMBER' } });
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'paper.pdf', { type: 'application/pdf' }));
    formData.append('type', 'pdf');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: false, code: 'INVALID_FILE' });
    expect(filesystem.writeFile).not.toHaveBeenCalled();
  });

  it('derives the saved extension from verified content rather than the submitted filename', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'admin-1', role: 'ADMIN' } });
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'avatar.exe', { type: 'image/png' }));
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: true, mimeType: 'image/png', fileName: 'avatar.png' });
    expect(result.url).toMatch(/^\/uploads\/thumbnails\/[\w-]+\.png$/);
  });

  it('returns a generic error when the local filesystem write fails', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'admin-1', role: 'ADMIN' } });
    filesystem.writeFile.mockRejectedValueOnce(new Error('EACCES: D:\\secret\\uploads'));
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'paper.pdf', { type: 'application/pdf' }));
    formData.append('type', 'pdf');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: false, code: 'UPLOAD_FAILED' });
    expect(result.error).not.toContain('secret');
  });
});
