import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'node:path';
import { deleteRegisteredImageKitAsset, getImageKitConfig, uploadImageKitAsset } from './imagekit';
import { registerUploadedAsset } from './registry';

export async function writeStoredAsset(kind: 'resource' | 'thumbnail' | 'pdf', filename: string, bytes: Uint8Array, ownerId?: string): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}$/.test(filename)) throw new Error('Invalid stored filename');
  const folder = kind === 'resource' ? 'resources' : kind === 'thumbnail' ? 'thumbnails' : 'documents';
  const url = `/uploads/${folder}/${filename}`;
  const imagekit = getImageKitConfig();
  if (imagekit) {
    const uploaded = await uploadImageKitAsset(url, bytes, imagekit);
    try { await registerUploadedAsset({ url, provider: 'imagekit', fileId: uploaded.fileId, ownerId, private: true }); }
    catch (error) { await deleteRegisteredImageKitAsset(uploaded.fileId, imagekit).catch(() => {}); throw error; }
    return url;
  }
  const directory = path.join(process.cwd(), 'storage', folder);
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, filename);
  await writeFile(target, bytes, { flag: 'wx' });
  try { await registerUploadedAsset({ url, provider: 'local', ownerId, private: true }); }
  catch (error) { await unlink(target).catch(() => {}); throw error; }
  return url;
}
