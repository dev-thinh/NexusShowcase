/** Keep delivery paths constrained to application-managed uploads. */
export function assertAssetPath(localUrl: string) {
  if (!/^\/uploads\/(?:thumbnails\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)|documents\/[a-zA-Z0-9_-]+\.pdf|resources\/[a-zA-Z0-9_-]+\.[a-z0-9]{1,16})$/.test(localUrl)) throw new Error('Invalid asset path');
}

export function getAssetStorageProvider(): 'local' | 'imagekit' {
  const provider = process.env.ASSET_STORAGE || 'local';
  if (provider !== 'local' && provider !== 'imagekit') throw new Error('Invalid ASSET_STORAGE configuration; use local or imagekit');
  return provider;
}
