import { describe, it, expect, vi } from 'vitest';
import { uploadFileAction } from '@/actions/upload-actions';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

describe('Upload File Action Unit Tests', () => {
  it('should reject upload if user is not authenticated', async () => {
    (auth as any).mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.png', { type: 'image/png' }));
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('mới có quyền');
  });

  it('should reject invalid MIME type for thumbnail', async () => {
    (auth as any).mockResolvedValueOnce({
      user: { id: 'core-1', role: 'CORE_MEMBER' },
    });

    const formData = new FormData();
    formData.append('file', new File(['test'], 'malicious.exe', { type: 'application/x-msdownload' }));
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Chỉ chấp nhận tệp hình ảnh');
  });

  it('should reject empty or missing file', async () => {
    (auth as any).mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('type', 'thumbnail');

    const result = await uploadFileAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Vui lòng chọn');
  });
});
