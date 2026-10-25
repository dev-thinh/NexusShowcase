import 'server-only';
import type { Actor } from '@/features/identity/model/session';
import { getAssetAccess } from './access';
import { inspectAssetReferences } from './references';

/** Check before persisting references: the new placement must never grant its own permission. */
export async function canReferenceAssets(actor: Actor, value: unknown): Promise<boolean> {
  let urls: Set<string>;
  try { ({ urls } = inspectAssetReferences(value, { strictLocal: true })); }
  catch { return false; }
  for (const url of urls) {
    if (!(await getAssetAccess(url, actor)).allowed) return false;
  }
  return true;
}
