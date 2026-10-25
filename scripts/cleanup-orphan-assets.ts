import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import { inventoryAssetReferences } from '../src/features/assets/server/references';
import { planOrphanAssets } from '../src/features/assets/server/orphans';
import { deleteRegisteredImageKitAsset, getImageKitConfig } from '../src/features/assets/server/imagekit';
import { staticAssetReferences } from './static-asset-references';

/** Dry run by default; --apply requires installed reference guards and claims before deletion. */
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply' && !/^--grace-days=\d+$/.test(arg))) throw new Error('Usage: cleanup-orphan-assets.ts [--apply] [--grace-days=7]');
  const graceDays = Number(args.find(arg => arg.startsWith('--grace-days='))?.split('=')[1] ?? 7);
  loadEnvConfig(process.cwd());
  const db = new PrismaClient({ log: [] });
  try {
    const statics = await staticAssetReferences(process.cwd());
    const references = await inventoryAssetReferences(db);
    statics.forEach(url => references.urls.add(url));
    const candidates = planOrphanAssets(await db.asset.findMany(), references, new Date(), graceDays);
    let quarantined = 0, deleted = 0;
    if (args.includes('--apply')) {
      const guards = await db.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) AS count FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace pn ON pn.oid=p.pronamespace WHERE n.nspname=current_schema() AND pn.nspname=current_schema() AND p.proname='guard_asset_references' AND tgname IN ('users_asset_guard','showcase_items_asset_guard','item_links_asset_guard','item_attachments_asset_guard','submission_revisions_asset_guard','editorial_drafts_asset_guard','home_moments_gallery_asset_guard') AND tgenabled = 'O' AND NOT tgisinternal`;
      if (Number(guards[0]?.count) !== 7) throw new Error('Reference-write guard migration must be installed before cleanup');
      const config = getImageKitConfig(true);
      if (!config) throw new Error('ImageKit configuration required');
      for (const candidate of candidates) {
        const token = randomUUID();
        const claimed = await db.$transaction(async tx => {
          const latest = await inventoryAssetReferences(tx as unknown as PrismaClient);
          statics.forEach(url => latest.urls.add(url));
          const current = await tx.asset.findUnique({ where: { id: candidate.id } });
          if (!current || !planOrphanAssets([current], latest, new Date(), graceDays).length) return false;
          const result = await tx.asset.updateMany({ where: { id: current.id, deletionStartedAt: null, deletedAt: null, fileId: candidate.fileId }, data: { deletionToken: token, deletionStartedAt: new Date() } });
          return result.count === 1;
        }, { isolationLevel: 'Serializable' });
        if (!claimed) continue;
        quarantined++;
        // Claims now reject concurrent references at the database boundary. Recheck
        // after commit catches references that committed before the claim acquired its lock.
        const recheck = await inventoryAssetReferences(db);
        (await staticAssetReferences(process.cwd())).forEach(url => recheck.urls.add(url));
        if (recheck.incompleteSources.length || recheck.urls.has(candidate.url)) throw new Error('Claimed asset gained references; retained in quarantine');
        const current = await db.asset.findUnique({ where: { id: candidate.id } });
        if (!current || current.deletionToken !== token || current.fileId !== candidate.fileId || current.deletedAt) throw new Error('Asset claim changed; deletion refused');
        await deleteRegisteredImageKitAsset(candidate.fileId!, config);
        await db.asset.updateMany({ where: { id: candidate.id, deletionToken: token }, data: { deletedAt: new Date() } });
        deleted++;
      }
    }
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', candidates: candidates.map(({ id, url }) => ({ id, url })), quarantined, deleted }, null, 2));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Orphan operation refused or interrupted; inspect quarantined rows before retrying.'); process.exitCode = 1; });
