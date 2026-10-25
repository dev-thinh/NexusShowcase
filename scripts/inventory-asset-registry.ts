import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import { inventoryAssetReferences } from '../src/features/assets/server/references';
import { planOrphanAssets } from '../src/features/assets/server/orphans';

/** Read-only backfill proposal: unknown legacy objects retain unknown provider/fileId/age. */
async function main() {
  if (process.argv.slice(2).some(arg => !/^--grace-days=\d+$/.test(arg))) throw new Error('Usage: inventory-asset-registry.ts [--grace-days=7] (read-only)');
  const graceDays = Number(process.argv.find(arg => arg.startsWith('--grace-days='))?.split('=')[1] ?? 7);
  loadEnvConfig(process.cwd());
  const db = new PrismaClient({ log: [] });
  try {
    const references = await inventoryAssetReferences(db);
    const assets = await db.asset.findMany();
    const known = new Set(assets.map(asset => asset.url));
    const legacy = [...references.urls].filter(url => !known.has(url)).map(url => ({ url, provider: null, fileId: null, action: 'retain: manual provenance reconciliation required' }));
    const candidates = references.incompleteSources.length ? [] : planOrphanAssets(assets, references, new Date(), graceDays).map(({ id, url }) => ({ id, url }));
    console.log(JSON.stringify({ mode: 'read-only', incompleteSources: references.incompleteSources, legacyBackfillProposal: legacy, orphanCandidates: candidates }, null, 2));
    if (references.incompleteSources.length) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Asset inventory failed; no data or files were changed.'); process.exitCode = 1; });
