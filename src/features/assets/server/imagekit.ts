import { assertAssetPath, getAssetStorageProvider } from './asset-path';

export type ImageKitConfig = { privateKey: string; endpoint: string; folder: string };
export function getImageKitConfig(force = false): ImageKitConfig | null {
  if (!force && getAssetStorageProvider() === 'local') return null;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim().replace(/\/+$/, '');
  const folder = (process.env.IMAGEKIT_FOLDER?.trim() || 'nexus-showcase').replace(/^\/+|\/+$/g, '');
  if (!privateKey?.startsWith('private_') || !endpoint || !/^https:\/\/ik\.imagekit\.io\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(endpoint) || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(folder)) throw new Error('ImageKit configuration is missing or invalid');
  return { privateKey, endpoint, folder };
}

export function imageKitObject(localUrl: string, config: ImageKitConfig) {
  assertAssetPath(localUrl);
  const filePath = `/${config.folder}${localUrl}`;
  return { filePath, folder: filePath.slice(0, filePath.lastIndexOf('/')), fileName: filePath.split('/').at(-1)!, url: `${config.endpoint}${filePath}?tr=orig-true` };
}

export async function uploadImageKitAsset(localUrl: string, bytes: Uint8Array, config: ImageKitConfig) {
  const object = imageKitObject(localUrl, config);
  const form = new FormData();
  form.set('file', new Blob([new Uint8Array(bytes)]), object.fileName);
  form.set('fileName', object.fileName);
  form.set('folder', object.folder);
  form.set('useUniqueFileName', 'false');
  form.set('overwriteFile', 'false');
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${config.privateKey}:`).toString('base64')}` },
    body: form, signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`ImageKit upload failed (${response.status})`);
  let result: { fileId?: string; filePath?: string; url?: string };
  try { result = await response.json(); } catch { throw new Error('Invalid ImageKit upload response'); }
  if (!result.fileId || result.filePath !== object.filePath || result.url !== `${config.endpoint}${object.filePath}`) throw new Error('Invalid ImageKit upload response');
  return { ...object, fileId: result.fileId };
}

/** Only used to remove our newly-created connectivity probe, never existing media. */
export async function deleteImageKitProbe(fileId: string, config: ImageKitConfig) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) throw new Error('Invalid ImageKit file ID');
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE', headers: { Authorization: `Basic ${Buffer.from(`${config.privateKey}:`).toString('base64')}` }, signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`ImageKit probe cleanup failed (${response.status})`);
}
