import 'server-only';
import { prisma } from '@/server/db/prisma';
import { getActor } from '@/features/identity/server/actor';
import { assertAssetPath } from './asset-path';
import { findRegisteredAsset } from './registry';
import { inspectAssetReferences } from './references';

type ItemReference = { creatorId: string; status: string; visibility: string; live: unknown; drafts: unknown };
const denied = { allowed: false, public: false } as const;
const hasReference = (value: unknown, url: string) => inspectAssetReferences(value).urls.has(url);

/** Public placement grants public reads; drafts and history never grant anonymous reads. */
export async function getAssetAccess(url: string): Promise<{ allowed: boolean; public: boolean }> {
  assertAssetPath(url);
  const registered = await findRegisteredAsset(url);
  if (registered?.deletedAt || registered?.deletionToken) return denied;
  const items = await prisma.$queryRaw<ItemReference[]>`
    SELECT * FROM (
      SELECT i."creatorId", i.status::text, i.visibility::text,
        jsonb_build_array(i."thumbnailUrl", i.content, i."mediaDriveUrl",
          (SELECT jsonb_agg(l.url) FROM item_links l WHERE l."itemId" = i.id),
          (SELECT jsonb_agg(a."fileUrl") FROM item_attachments a WHERE a."itemId" = i.id)) AS live,
        jsonb_build_array(i."authorDraft", e.overrides,
          (SELECT jsonb_agg(r.snapshot) FROM submission_revisions r WHERE r."itemId" = i.id)) AS drafts
      FROM showcase_items i LEFT JOIN editorial_drafts e ON e."itemId" = i.id
    ) refs WHERE position(${url} in normalize_asset_reference_text(concat(refs.live::text, refs.drafts::text))) > 0
  `;
  const references = items.map(item => ({ ...item, liveAsset: hasReference(item.live, url), draftAsset: hasReference(item.drafts, url) }));
  if (references.some(item => item.liveAsset && item.status === 'PUBLISHED' && item.visibility === 'PUBLIC')) return { allowed: true, public: true };
  if (url.startsWith('/uploads/thumbnails/')) {
    const [galleries, avatar] = await Promise.all([
      prisma.homeMomentsGallery.findMany({ select: { photos: true } }),
      prisma.user.findFirst({ where: { avatarUrl: url, status: 'ACTIVE', deletedAt: null }, select: { id: true } }),
    ]);
    if (avatar || galleries.some(gallery => Array.isArray(gallery.photos) && gallery.photos.some(photo => photo && typeof photo === 'object' && !Array.isArray(photo) && photo.src === url && photo.visible === true && photo.slot !== null))) return { allowed: true, public: true };
  }
  const actor = await getActor();
  if (!actor) return denied;
  if (registered?.ownerId === actor.id || actor.role === 'ADMIN') return { allowed: true, public: false };
  if (references.some(item => (item.liveAsset && item.status === 'PUBLISHED') || ((item.liveAsset || item.draftAsset) && (item.creatorId === actor.id || actor.role === 'EDITOR')))) return { allowed: true, public: false };
  return denied;
}
