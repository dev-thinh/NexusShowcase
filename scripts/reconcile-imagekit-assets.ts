import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import { getImageKitConfig, imageKitObject } from '../src/features/assets/server/imagekit';
import { inventoryAssetReferences, inspectAssetReferences } from '../src/features/assets/server/references';
import { imageKitAuthorization, reconcileImageKitObject, validateReconciliationMetadata, type ReconciliationMetadata } from './imagekit-reconciliation';

async function publicReferences(db: PrismaClient) {
  const urls = new Set<string>();
  const add = (value: unknown) => inspectAssetReferences(value).urls.forEach(url => urls.add(url));
  const galleries = await db.homeMomentsGallery.findMany({ select: { photos: true } });
  for (const gallery of galleries) if (Array.isArray(gallery.photos)) for (const photo of gallery.photos) {
    if (photo && typeof photo === 'object' && !Array.isArray(photo) && photo.visible === true && photo.slot !== null) add(photo.src);
  }
  add(await db.user.findMany({ where: { status: 'ACTIVE', deletedAt: null }, select: { avatarUrl: true } }));
  add(await db.showcaseItem.findMany({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' }, select: { thumbnailUrl: true, content: true, mediaDriveUrl: true, links: { select: { url: true } }, attachments: { select: { fileUrl: true } } } }));
  return urls;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply' && arg !== '--purge-cache') || new Set(args).size !== args.length || (args.includes('--purge-cache') && !args.includes('--apply'))) throw new Error('Usage: reconcile-imagekit-assets.ts [--apply [--purge-cache]]');
  loadEnvConfig(process.cwd());
  const config = getImageKitConfig(true);
  if (!config) throw new Error('ImageKit configuration required');
  const db = new PrismaClient({ log: [] });
  try {
    const references = await inventoryAssetReferences(db);
    if (references.incompleteSources.length) throw new Error('Incomplete reference provenance');
    const publicUrls = await publicReferences(db);
    const candidates = [...references.urls].filter(url => publicUrls.has(url)).sort();
    const byPath = new Map<string, ReconciliationMetadata>();
    // Limit list reads to the configured project namespace, never the account root.
    const folders = new Set(candidates.map(url => imageKitObject(url, config).folder));
    for (const folder of folders) for (let skip = 0; skip < 100_000; skip += 1000) {
      const query = new URLSearchParams({ path: folder, type: 'file', limit: '1000', skip: String(skip) });
      const response = await fetch(`https://api.imagekit.io/v1/files?${query}`, { headers: imageKitAuthorization(config), redirect: 'error', signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error('Provider inventory failed');
      const rows: unknown = await response.json();
      if (!Array.isArray(rows)) throw new Error('Invalid provider inventory');
      for (const row of rows) {
        const path = row && typeof row === 'object' ? (row as { filePath?: unknown }).filePath : undefined;
        const url = candidates.find(url => imageKitObject(url, config).filePath === path);
        if (!url) continue;
        const metadata = validateReconciliationMetadata(row, url, config);
        if (byPath.has(metadata.filePath)) throw new Error('Ambiguous provider path');
        byPath.set(metadata.filePath, metadata);
      }
      if (rows.length < 1000) break;
      if (skip === 99_000) throw new Error('Provider inventory pagination bound exceeded');
    }
    const proposal = candidates.map(url => {
      const metadata = byPath.get(imageKitObject(url, config).filePath);
      if (!metadata) throw new Error('Referenced public object missing from exact provider inventory');
      return { url, metadata };
    });
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', candidates: proposal.map(({ url, metadata }) => ({ url, fileId: metadata.fileId, createdAt: metadata.createdAt, private: metadata.isPrivateFile, action: metadata.isPrivateFile ? 'verify-and-register' : 'same-bytes-private-reupload' })), restrictedOrUnknownReferencesSkipped: references.urls.size - candidates.length }, null, 2));
    if (!args.includes('--apply')) return;
    for (const { url, metadata } of proposal) {
      const latest = await inventoryAssetReferences(db);
      if (latest.incompleteSources.length || !latest.urls.has(url) || !(await publicReferences(db)).has(url)) throw new Error('Reference/public provenance changed');
      const existing = await db.asset.findUnique({ where: { url } });
      if (existing && (existing.provider !== 'imagekit' || (existing.fileId && existing.fileId !== metadata.fileId) || existing.deletionToken || existing.deletedAt)) throw new Error('Registry identity or deletion state conflicts');
      const verified = await reconcileImageKitObject(url, metadata, config, fetch, { purgeCache: args.includes('--purge-cache') });
      await db.$transaction(async tx => {
        const current = await tx.asset.findUnique({ where: { url } });
        if (current && (current.id !== existing?.id || current.provider !== 'imagekit' || current.fileId !== existing?.fileId || current.deletionToken || current.deletedAt)) throw new Error('Registry changed during reconciliation');
        if (current) await tx.asset.update({ where: { id: current.id }, data: { fileId: verified.fileId, private: true } });
        else await tx.asset.create({ data: { url, provider: 'imagekit', fileId: verified.fileId, private: true, createdAt: verified.createdAt } });
      }, { isolationLevel: 'Serializable' });
      console.log(JSON.stringify({ url, reconciled: true, sha256: verified.sha256 }));
    }
  } finally { await db.$disconnect(); }
}
main().catch(error => {
  const message = error instanceof Error ? error.message : '';
  if (error instanceof Error && !/^(Provider|Invalid|Referenced|Unverified|Incomplete|Ambiguous|Privacy|Original|Unsigned|Signed|Registry|Exact|Unexpected)/.test(message)) {
    const code = (error.cause as { code?: unknown } | undefined)?.code;
    console.error(`Reconciliation failure category: ${error.name}${typeof code === 'string' && /^[A-Z_0-9]+$/.test(code) ? ` (${code})` : ''}`);
  }
  if (/^(Provider inventory failed|Invalid provider inventory|Referenced public object missing|Unverified provider metadata|Incomplete reference provenance|Ambiguous provider path|Provider inventory pagination|Privacy reupload failed|Provider did not confirm|Original bytes changed|Unsigned origin access remains possible|Signed original read failed|Provider metadata changed|Provider metadata read failed|Registry identity|Registry changed|Exact cache purge|Unexpected exact cache purge|Invalid exact cache purge)/.test(message)) console.error(message);
  console.error('Legacy reconciliation stopped; inspect provider/registry state before retrying. No objects were deleted.'); process.exitCode = 1;
});
