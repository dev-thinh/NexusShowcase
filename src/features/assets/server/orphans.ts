import type { ReferenceInventory } from './references';

export type RegisteredAsset = { id: string; url: string; provider: string; fileId: string | null; createdAt: Date; deletedAt: Date | null; deletionStartedAt: Date | null };

/** A candidate is an inventory result, never permission to delete a provider object. */
export function planOrphanAssets<T extends RegisteredAsset>(assets: T[], references: ReferenceInventory, now = new Date(), graceDays = 7): T[] {
  if (!Number.isFinite(graceDays) || graceDays < 7) throw new Error('Orphan grace period must be at least seven days');
  if (references.incompleteSources.length) throw new Error('Asset reference inventory is incomplete; cleanup refused');
  const cutoff = now.getTime() - graceDays * 86400000;
  return assets.filter(asset => asset.provider === 'imagekit' && Boolean(asset.fileId) && !asset.deletedAt && !asset.deletionStartedAt && asset.createdAt.getTime() <= cutoff && !references.urls.has(asset.url));
}
