import { mkdir, writeFile } from 'fs/promises';
import path from 'node:path';
import { getImageKitConfig, uploadImageKitAsset } from './imagekit';

export async function writeStoredAsset(kind: 'resource' | 'thumbnail' | 'pdf', filename: string, bytes: Uint8Array): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}$/.test(filename)) throw new Error('Invalid stored filename');
  const folder = kind === 'resource' ? 'resources' : kind === 'thumbnail' ? 'thumbnails' : 'documents';
  const url = `/uploads/${folder}/${filename}`;
  const imagekit = getImageKitConfig();
  if (imagekit) {
    await uploadImageKitAsset(url, bytes, imagekit);
    return url;
  }
  const directory = kind === 'resource' ? path.join(process.cwd(), 'storage', folder) : path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return url;
}
