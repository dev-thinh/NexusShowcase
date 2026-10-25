import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('fs/promises', () => ({ readFile: mocks.read }));
vi.mock('@/features/assets/server/access', () => ({ getAssetAccess: vi.fn(async () => ({ allowed: true, public: true })) }));
import { GET } from '@/app/uploads/thumbnails/[filename]/route';
const read = (filename: string) => GET(new Request('http://localhost/uploads/thumbnails/' + filename), { params: Promise.resolve({ filename }) });
beforeEach(() => { vi.clearAllMocks(); mocks.read.mockResolvedValue(Buffer.from([1, 2, 3])); });
it('serves new uploads dynamically with image content type and nosniff', async () => {
  const response = await read('new-photo.webp');
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toBe('image/webp');
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(mocks.read).toHaveBeenCalledWith(expect.stringContaining('new-photo.webp'));
});
it.each(['../secret.webp', 'script.svg', 'file.html', 'foo.png/secret'])('rejects unsafe filenames (%s)', async filename => {
  expect((await read(filename)).status).toBe(404);
  expect(mocks.read).not.toHaveBeenCalled();
});
it('handles missing files without exposing disk details', async () => {
  mocks.read.mockRejectedValue(Object.assign(new Error('private disk path'), { code: 'ENOENT' }));
  const response = await read('missing.webp');
  expect(response.status).toBe(404);
  expect(await response.text()).not.toContain('private');
});
