import { afterEach, expect, it, vi } from 'vitest';
import { getImageKitConfig, imageKitObject, uploadImageKitAsset } from '@/features/assets/server/imagekit';

const config = { privateKey: 'private_test', endpoint: 'https://ik.imagekit.io/test', folder: 'nexus-showcase' };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('maps local URLs to stable project paths and original-byte delivery', () => {
  expect(imageKitObject('/uploads/thumbnails/test.jpg', config)).toEqual({ filePath: '/nexus-showcase/uploads/thumbnails/test.jpg', fileName: 'test.jpg', folder: '/nexus-showcase/uploads/thumbnails', url: 'https://ik.imagekit.io/test/nexus-showcase/uploads/thumbnails/test.jpg?tr=orig-true' });
  expect(() => imageKitObject('/uploads/resources/../secret', config)).toThrow();
});
it('requires explicit activation and a valid ImageKit endpoint', () => {
  vi.stubEnv('ASSET_STORAGE', 'local'); expect(getImageKitConfig()).toBeNull();
  vi.stubEnv('ASSET_STORAGE', 'imagekit'); vi.stubEnv('IMAGEKIT_PRIVATE_KEY', 'private_test'); vi.stubEnv('IMAGEKIT_URL_ENDPOINT', 'https://evil.test/key');
  expect(() => getImageKitConfig()).toThrow('ImageKit configuration');
});
it('uploads without overwriting or renaming the stored file', async () => {
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ fileId: 'test-id', filePath: '/nexus-showcase/uploads/resources/test.zip', url: 'https://ik.imagekit.io/test/nexus-showcase/uploads/resources/test.zip' })));
  vi.stubGlobal('fetch', request);
  expect(await uploadImageKitAsset('/uploads/resources/test.zip', new Uint8Array([1]), config)).toMatchObject({ fileId: 'test-id' });
  expect(request.mock.calls[0][0]).toBe('https://upload.imagekit.io/api/v1/files/upload');
  const options = request.mock.calls[0][1];
  expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('private_test:').toString('base64')}`);
  expect(options.body.get('useUniqueFileName')).toBe('false');
  expect(options.body.get('overwriteFile')).toBe('false');
});
it('rejects an unexpected response path and sanitizes provider errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ fileId: 'id', filePath: '/other/test.zip', url: 'https://ik.imagekit.io/test/other/test.zip' }))).mockResolvedValueOnce(new Response('private_test', { status: 401 })));
  await expect(uploadImageKitAsset('/uploads/resources/test.zip', new Uint8Array([1]), config)).rejects.toThrow('Invalid ImageKit upload response');
  await expect(uploadImageKitAsset('/uploads/resources/test.zip', new Uint8Array([1]), config)).rejects.toThrow('ImageKit upload failed (401)');
});
