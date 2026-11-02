import { reserveUpload, releaseUpload } from './upload-quota';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'node:path';
import { deleteRegisteredImageKitAsset, getImageKitConfig, uploadImageKitAsset } from './imagekit';
import { registerUploadedAsset } from './registry';

export async function writeStoredAsset(kind: 'resource' | 'thumbnail' | 'pdf', filename: string, bytes: Uint8Array, ownerId: string): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}$/.test(filename)) throw new Error('Invalid stored filename');
  const folder = kind === 'resource' ? 'resources' : kind === 'thumbnail' ? 'thumbnails' : 'documents';
  const url = `/uploads/${folder}/${filename}`;
  const reservation = await reserveUpload(ownerId, bytes.byteLength, url);
  let releasable = true;
  try {
    const imagekit = getImageKitConfig();
    if (imagekit) {
      releasable = false;
      const uploaded = await uploadImageKitAsset(url, bytes, imagekit);
      try { await registerUploadedAsset({ url, provider: 'imagekit', fileId: uploaded.fileId, ownerId, byteSize: BigInt(bytes.byteLength), private: true }); }
      catch (error) {
        try { await deleteRegisteredImageKitAsset(uploaded.fileId, imagekit); releasable = true; } catch { /* Retain reservation until provider reconciliation. */ }
        throw error;
      }
      releasable = true;
      return url;
    }
    const directory = path.join(process.cwd(), 'storage', folder);
    await mkdir(directory, { recursive: true });
    const target = path.join(directory, filename);
    // A rejected write may still have created a partial file. Keep its capacity
    // until an operator verifies cleanup; never unlink a path we did not own.
    releasable = false;
    await writeFile(target, bytes, { flag: 'wx' });
    try { await registerUploadedAsset({ url, provider: 'local', ownerId, byteSize: BigInt(bytes.byteLength), private: true }); }
    catch (error) {
      try { await unlink(target); releasable = true; } catch { /* Retain capacity for the unregistered local file. */ }
      throw error;
    }
    releasable = true;
    return url;
  } finally { if (releasable) await releaseUpload(reservation); }
}
