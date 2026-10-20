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

  it('accepts an authenticated, signature-verified PDF resource', async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: 'core-1', role: 'CORE_MEMBER' } });
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'research.pdf', { type: 'application/pdf' }));
    formData.append('type', 'pdf');

    const result = await uploadFileAction(formData);

    expect(result).toMatchObject({ success: true, mimeType: 'application/pdf', fileName: 'research.pdf' });
    expect(result.url).toMatch(/^\/uploads\/documents\/[\w-]+\.pdf$/);
  });
});

describe('general resource uploads', () => {
  it.each(['dataset.csv', 'model.onnx', 'design.step', 'slides.pptx', 'source.zip', 'README'])('accepts %s as a downloadable resource', async fileName => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'core-1', role: 'CORE_MEMBER' } } as never);
    const data = new FormData();
    data.append('type', 'resource');
    data.append('file', new File(['resource bytes'], fileName, { type: 'application/octet-stream' }));
    const result = await uploadFileAction(data);
    expect(result).toMatchObject({ success: true, fileName, fileSize: 14, mimeType: 'application/octet-stream' });
    expect(result.url).toMatch(/^\/uploads\/resources\/[\w-]+\.[a-z0-9]+$/);
    expect(filesystem.writeFile.mock.calls.at(-1)?.[0]).toContain('/storage/resources/');
    expect(filesystem.writeFile.mock.calls.at(-1)?.[0]).not.toContain('/public/');
  });
  it('keeps the 25 MB limit for general resource files', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'core-1', role: 'CORE_MEMBER' } } as never);
    const data = new FormData();
    data.append('type', 'resource');
    data.append('file', new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'model.onnx'));
    expect(await uploadFileAction(data)).toMatchObject({ success: false, code: 'INVALID_FILE' });
  });
});
