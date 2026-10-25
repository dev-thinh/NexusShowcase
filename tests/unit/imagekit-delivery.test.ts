import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const filesystem = vi.hoisted(() => ({ readFile: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn() }));
vi.mock('fs/promises', () => filesystem);
import { readStoredAsset } from '@/features/assets/server/delivery';
vi.mock('@/features/assets/server/registry', () => ({ registerUploadedAsset: vi.fn() }));
import { writeStoredAsset } from '@/features/assets/server/storage';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ASSET_STORAGE', 'imagekit'); vi.stubEnv('IMAGEKIT_URL_ENDPOINT', 'https://ik.imagekit.io/test');
  vi.stubEnv('IMAGEKIT_PRIVATE_KEY', 'private_test');
  vi.stubEnv('IMAGEKIT_FOLDER', 'nexus-showcase');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('reads cloud bytes without reading disk', async () => {
  const request = vi.fn().mockResolvedValue(new Response('cloud bytes'));
  vi.stubGlobal('fetch', request);
  expect(Buffer.from(await readStoredAsset('/uploads/resources/file.zip')).toString()).toBe('cloud bytes');
  const delivered = new URL(request.mock.calls[0][0]);
  expect(delivered.pathname).toBe('/test/nexus-showcase/uploads/resources/file.zip');
  expect(delivered.searchParams.get('tr')).toBe('orig-true');
  expect(delivered.searchParams.get('ik-s')).toMatch(/^[a-f0-9]{40}$/);
  expect(Number(delivered.searchParams.get('ik-t'))).toBeGreaterThan(Date.now() / 1000);
  expect(filesystem.readFile).not.toHaveBeenCalled();
});
it('keeps old local assets available before migration', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
  filesystem.readFile.mockResolvedValue(Buffer.from('legacy bytes'));
  expect(Buffer.from(await readStoredAsset('/uploads/resources/file.zip')).toString()).toBe('legacy bytes');
});
it('does not silently write to disk when cloud upload fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret', { status: 503 })));
  await expect(writeStoredAsset('resource', 'file.zip', new Uint8Array([1]))).rejects.toThrow('ImageKit upload failed (503)');
  expect(filesystem.writeFile).not.toHaveBeenCalled();
});
it('preserves stable app URLs for new cloud uploads', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ fileId: 'test-id', filePath: '/nexus-showcase/uploads/resources/file.zip', url: 'https://ik.imagekit.io/test/nexus-showcase/uploads/resources/file.zip' }))));
  expect(await writeStoredAsset('resource', 'file.zip', new Uint8Array([1]))).toBe('/uploads/resources/file.zip');
  expect(filesystem.mkdir).not.toHaveBeenCalled();
});
it('rejects oversized cloud bodies before consuming them', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oversized', { headers: { 'Content-Length': String(6 * 1024 * 1024) } })));
  filesystem.readFile.mockRejectedValue(Object.assign(new Error(), { code: 'ENOENT' }));
  await expect(readStoredAsset('/uploads/thumbnails/file.png')).rejects.toThrow('ImageKit delivery unavailable');
});
