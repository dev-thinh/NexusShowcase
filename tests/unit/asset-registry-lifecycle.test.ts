import { describe, expect, it } from 'vitest';
import { extractLocalAssetUrls, inspectAssetReferences, inventoryAssetReferences } from '../../src/features/assets/server/references';
import type { PrismaClient } from '@prisma/client';
import { planOrphanAssets } from '../../src/features/assets/server/orphans';

describe('asset provenance and orphan planning', () => {
  it('retains nested live, draft, revision and gallery references and ignores foreign origins', () => {
    expect([...extractLocalAssetUrls({ photos: ['/uploads/thumbnails/gallery.png'], draft: 'nexus-sections:v1\n{"fileUrl":"/uploads/documents/draft.pdf"}', content: '<img src="/uploads/thumbnails/live.jpg">', foreign: 'https://foreign.test/images/a.pdf' })].sort()).toEqual(['/uploads/documents/draft.pdf', '/uploads/thumbnails/gallery.png', '/uploads/thumbnails/live.jpg']);
  });
  it('fails closed on malformed structured snapshots and noncanonical managed paths', () => {
    expect(() => extractLocalAssetUrls('nexus-sections:v1\n{broken')).toThrow();
    expect(inspectAssetReferences('/uploads/documents/%2e%2e/secret.pdf').incomplete).toBe(true);
    expect(inspectAssetReferences('https://foreign.test/uploads/documents/a.pdf')).toEqual({ urls: new Set(), incomplete: true });
  });
  it('recognizes repeatedly encoded managed URLs without accepting external origin aliases', () => {
    expect([...extractLocalAssetUrls('%252Fuploads%252Fdocuments%252Fencoded.pdf')]).toEqual(['/uploads/documents/encoded.pdf']);
    expect([...extractLocalAssetUrls('&#47;uploads&#x2f;documents&#47;entity.pdf')]).toEqual(['/uploads/documents/entity.pdf']);
    expect([...extractLocalAssetUrls(String.raw`\u002fuploads\u002fdocuments\u002funicode.pdf`)]).toEqual(['/uploads/documents/unicode.pdf']);
    expect(inspectAssetReferences('https:%2f%2fforeign.test%2fuploads%2fdocuments%2fa.pdf')).toEqual({ urls: new Set(), incomplete: true });
  });
  it('only proposes old registry-owned objects with complete provenance', () => {
    const now = new Date('2026-10-25T00:00:00Z');
    const asset = { id: 'old', url: '/uploads/documents/old.pdf', provider: 'imagekit', fileId: 'known', createdAt: new Date('2026-10-01'), deletedAt: null, deletionStartedAt: null };
    expect(planOrphanAssets([asset, { ...asset, id: 'legacy', fileId: null }, { ...asset, id: 'new', createdAt: now }], { urls: new Set(), incompleteSources: [] }, now).map(row => row.id)).toEqual(['old']);
    expect(() => planOrphanAssets([asset], { urls: new Set(), incompleteSources: ['gallery'] }, now)).toThrow('incomplete');
    expect(() => planOrphanAssets([asset], { urls: new Set(), incompleteSources: [] }, now, 1)).toThrow('seven');
    expect(planOrphanAssets([asset], { urls: new Set([asset.url]), incompleteSources: [] }, now)).toEqual([]);
  });
  it('protects references from every persisted source and flags failed source reads', async () => {
    // Substitute the external DB boundary; the scanner and planner remain real.
    const db = {
      user: { findMany: async () => [{ avatarUrl: '/uploads/thumbnails/avatar.png' }] },
      showcaseItem: { findMany: async () => [{ content: '/uploads/thumbnails/live.png', authorDraft: { fileUrl: '/uploads/documents/draft.pdf' } }] },
      itemLink: { findMany: async () => [{ url: '/uploads/resources/link.zip' }] },
      itemAttachment: { findMany: async () => [{ fileUrl: '/uploads/documents/attachment.pdf' }] },
      submissionRevision: { findMany: async () => [{ snapshot: { fileUrl: '/uploads/documents/revision.pdf' } }] },
      editorialDraft: { findMany: async () => [{ overrides: { content: '/uploads/thumbnails/editorial.png' } }] },
      homeMomentsGallery: { findMany: async () => [{ photos: ['/uploads/thumbnails/gallery.png'] }] },
    };
    const inventory = await inventoryAssetReferences(db as unknown as PrismaClient);
    expect([...inventory.urls].sort()).toEqual(['/uploads/documents/attachment.pdf', '/uploads/documents/draft.pdf', '/uploads/documents/revision.pdf', '/uploads/resources/link.zip', '/uploads/thumbnails/avatar.png', '/uploads/thumbnails/editorial.png', '/uploads/thumbnails/gallery.png', '/uploads/thumbnails/live.png']);
    expect(inventory.incompleteSources).toEqual([]);
    db.homeMomentsGallery.findMany = async () => { throw new Error('offline'); };
    expect((await inventoryAssetReferences(db as unknown as PrismaClient)).incompleteSources).toEqual(['gallery.photos']);
  });
});
