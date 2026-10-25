import { prisma } from '@/server/db/prisma';
import { assertAssetPath } from './asset-path';

export type UploadedAsset = { url: string; provider: 'local' | 'imagekit'; fileId?: string; ownerId?: string; private?: boolean };

/** Insert-only: a reused URL must never silently replace its provider identity or owner. */
export async function registerUploadedAsset(input: UploadedAsset) {
  assertAssetPath(input.url);
  if (input.provider === 'imagekit' && !input.fileId?.trim()) throw new Error('ImageKit asset requires provider fileId');
  return prisma.asset.create({ data: { url: input.url, provider: input.provider, fileId: input.fileId ?? null, ownerId: input.ownerId ?? null, private: input.private ?? false } });
}

export async function findRegisteredAsset(url: string) {
  assertAssetPath(url);
  return prisma.asset.findUnique({ where: { url } });
}
