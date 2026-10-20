import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/uploads/resources/[filename]/route';
import { submissionResourceSchema } from '@/lib/action-schemas';
const filesystem = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock('fs/promises', () => filesystem);

beforeEach(() => {
  vi.clearAllMocks();
  filesystem.readFile.mockResolvedValue(Buffer.from('resource bytes'));
});
const download = (filename: string, name = '') => GET(new Request(`https://nexus.test/uploads/resources/file?name=${encodeURIComponent(name)}`), { params: Promise.resolve({ filename }) });

describe('general resource downloads', () => {
  it('serves arbitrary uploaded formats as attachments with the display name', async () => {
    const response = await download('sample.onnx', 'Mô hình đã huấn luyện');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
    expect(response.headers.get('content-disposition')).toContain('attachment;');
    expect(response.headers.get('content-disposition')).toContain(encodeURIComponent('Mô hình đã huấn luyện.onnx'));
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).toBe('resource bytes');
  });
  it.each(['../secret', 'file.csv/../../secret', 'a.csv%0a', '..'])('rejects unsafe filename %s before reading disk', async filename => {
    expect((await download(filename)).status).toBe(404);
    expect(filesystem.readFile).not.toHaveBeenCalled();
  });
  it('returns 404 when a resource has been removed', async () => {
    filesystem.readFile.mockRejectedValueOnce(Object.assign(new Error(), { code: 'ENOENT' }));
    expect((await download('missing.zip')).status).toBe(404);
  });
  it('validates general resource URLs without widening thumbnail or article upload paths', () => {
    const resource = { kind: 'DOCUMENT', label: 'Tệp CAD', url: '/uploads/resources/design.step', mimeType: 'application/octet-stream' };
    expect(submissionResourceSchema.safeParse(resource).success).toBe(true);
    expect(submissionResourceSchema.safeParse({ ...resource, url: '/uploads/resources/../secret.step' }).success).toBe(false);
  });
});
