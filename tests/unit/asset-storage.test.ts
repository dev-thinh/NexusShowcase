import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ config: vi.fn(), upload: vi.fn(), removeCloud: vi.fn(), register: vi.fn(), reserve: vi.fn(), release: vi.fn(), mkdir: vi.fn(), write: vi.fn(), unlink: vi.fn() }));
vi.mock('fs/promises', () => ({ mkdir: mocks.mkdir, writeFile: mocks.write, unlink: mocks.unlink }));
vi.mock('@/features/assets/server/imagekit', () => ({ getImageKitConfig: mocks.config, uploadImageKitAsset: mocks.upload, deleteRegisteredImageKitAsset: mocks.removeCloud }));
vi.mock('@/features/assets/server/registry', () => ({ registerUploadedAsset: mocks.register }));
vi.mock('@/features/assets/server/upload-quota', () => ({reserveUpload: mocks.reserve, releaseUpload: mocks.release}));
import { writeStoredAsset } from '@/features/assets/server/storage';
beforeEach(() => { vi.resetAllMocks(); mocks.reserve.mockResolvedValue('reservation'); mocks.release.mockResolvedValue(undefined); mocks.config.mockReturnValue(null); mocks.register.mockResolvedValue({}); mocks.mkdir.mockResolvedValue(undefined); mocks.write.mockResolvedValue(undefined); mocks.unlink.mockResolvedValue(undefined); mocks.removeCloud.mockResolvedValue(undefined); });

it('stores local images outside public and preserves owner/provider identity', async () => {
  expect(await writeStoredAsset('thumbnail', 'new.png', new Uint8Array([1]), 'owner')).toBe('/uploads/thumbnails/new.png');
  expect(mocks.write.mock.calls[0][0].replaceAll('\\', '/')).toMatch(/\/storage\/thumbnails\/new\.png$/);
  expect(mocks.write.mock.calls[0][2]).toEqual({ flag: 'wx' });
  expect(mocks.register).toHaveBeenCalledWith({ url: '/uploads/thumbnails/new.png', provider: 'local', ownerId: 'owner', private: true, byteSize: 1n });
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

it('reserves before provider I/O, releases after success and denies over-quota writes', async () => {
  await writeStoredAsset('thumbnail','new.png',new Uint8Array([1]),'owner');
  expect(mocks.reserve).toHaveBeenCalledWith('owner',1,'/uploads/thumbnails/new.png');
  expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(mocks.write.mock.invocationCallOrder[0]);
  expect(mocks.release).toHaveBeenCalledWith('reservation');
  vi.clearAllMocks(); mocks.reserve.mockRejectedValueOnce(new Error('quota exceeded'));
  await expect(writeStoredAsset('thumbnail','denied.png',new Uint8Array([1]),'owner')).rejects.toThrow('quota exceeded');
  expect(mocks.write).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
});
it('releases capacity when registry/provider storage fails', async () => {
 mocks.register.mockRejectedValueOnce(new Error('database unavailable'));
 await expect(writeStoredAsset('thumbnail','new.png',new Uint8Array([1]),'owner')).rejects.toThrow();
 expect(mocks.release).toHaveBeenCalledWith('reservation');
});
it('retains the reservation when local I/O may have left an unregistered partial file', async () => {
 mocks.write.mockRejectedValueOnce(Object.assign(new Error('partial disk write'),{code:'ENOSPC'}));
 await expect(writeStoredAsset('thumbnail','partial.png',new Uint8Array([1]),'owner')).rejects.toThrow('partial disk write');
 expect(mocks.release).not.toHaveBeenCalled();
 expect(mocks.unlink).not.toHaveBeenCalled();
});
