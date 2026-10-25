import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ config: vi.fn(), upload: vi.fn(), removeCloud: vi.fn(), register: vi.fn(), mkdir: vi.fn(), write: vi.fn(), unlink: vi.fn() }));
vi.mock('fs/promises', () => ({ mkdir: mocks.mkdir, writeFile: mocks.write, unlink: mocks.unlink }));
vi.mock('@/features/assets/server/imagekit', () => ({ getImageKitConfig: mocks.config, uploadImageKitAsset: mocks.upload, deleteRegisteredImageKitAsset: mocks.removeCloud }));
vi.mock('@/features/assets/server/registry', () => ({ registerUploadedAsset: mocks.register }));
import { writeStoredAsset } from '@/features/assets/server/storage';
beforeEach(() => { vi.clearAllMocks(); mocks.config.mockReturnValue(null); mocks.register.mockResolvedValue({}); mocks.mkdir.mockResolvedValue(undefined); mocks.write.mockResolvedValue(undefined); mocks.unlink.mockResolvedValue(undefined); mocks.removeCloud.mockResolvedValue(undefined); });

it('stores local images outside public and preserves owner/provider identity', async () => {
  expect(await writeStoredAsset('thumbnail', 'new.png', new Uint8Array([1]), 'owner')).toBe('/uploads/thumbnails/new.png');
  expect(mocks.write.mock.calls[0][0].replaceAll('\\', '/')).toMatch(/\/storage\/thumbnails\/new\.png$/);
  expect(mocks.write.mock.calls[0][2]).toEqual({ flag: 'wx' });
  expect(mocks.register).toHaveBeenCalledWith({ url: '/uploads/thumbnails/new.png', provider: 'local', ownerId: 'owner', private: true });
});
it('cleans up only the newly written local object when registry persistence fails', async () => {
  mocks.register.mockRejectedValue(new Error('database unavailable'));
  await expect(writeStoredAsset('thumbnail', 'new.png', new Uint8Array([1]), 'owner')).rejects.toThrow('database unavailable');
  expect(mocks.unlink).toHaveBeenCalledWith(mocks.write.mock.calls[0][0]);
});
it('cleans up only the newly uploaded cloud identity if registry persistence fails', async () => {
  const config = { endpoint: 'https://ik.imagekit.io/test', folder: 'project', privateKey: 'private_test' };
  mocks.config.mockReturnValue(config); mocks.upload.mockResolvedValue({ fileId: 'new-file' });
  mocks.register.mockRejectedValue(new Error('database unavailable'));
  await expect(writeStoredAsset('resource', 'new.zip', new Uint8Array([1]), 'owner')).rejects.toThrow('database unavailable');
  expect(mocks.removeCloud).toHaveBeenCalledWith('new-file', config);
  expect(mocks.write).not.toHaveBeenCalled();
});
