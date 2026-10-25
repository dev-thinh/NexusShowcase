import { readFile } from 'fs/promises';
import path from 'node:path';
import { assertAssetPath } from './asset-path';
import { signedImageKitUrl, getImageKitConfig } from './imagekit';

/** Same-origin delivery retains existing URLs, download headers and local legacy files. */
export async function readStoredAsset(localUrl: string): Promise<Uint8Array> {
  // Validate against the same allowlist even when the local provider is active.
  assertAssetPath(localUrl);
  const config = getImageKitConfig();
  let remoteFailure: Error | undefined;
  if (config) {
    try {
      const remote = await fetch(signedImageKitUrl(localUrl, config), { signal: AbortSignal.timeout(15_000), cache: 'no-store' });
      if (remote.ok) {
        const limit = localUrl.startsWith('/uploads/thumbnails/') ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
        if (Number(remote.headers.get('content-length') || 0) > limit) { await remote.body?.cancel(); throw new Error('ImageKit asset exceeds size limit'); }
        const chunks: Uint8Array[] = [];
        let total = 0;
        const reader = remote.body?.getReader();
        if (!reader) throw new Error('Empty ImageKit asset response');
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > limit) throw new Error('ImageKit asset exceeds size limit');
            chunks.push(value);
          }
        } finally { await reader.cancel().catch(() => {}); }
        return new Uint8Array(Buffer.concat(chunks));
      }
      await remote.body?.cancel();
      if (remote.status !== 404) remoteFailure = new Error(`ImageKit delivery failed (${remote.status})`);
    } catch { remoteFailure = new Error('ImageKit delivery unavailable'); }
  }
  const relative = localUrl.slice('/uploads/'.length);
  try { return new Uint8Array(await readFile(path.join(process.cwd(), 'storage', relative))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' && !localUrl.startsWith('/uploads/resources/')) {
      try { return new Uint8Array(await readFile(path.join(process.cwd(), 'public', localUrl.slice(1)))); } catch { /* Legacy fallback is permission-gated by the route. */ }
    }
    if (remoteFailure) throw remoteFailure;
    throw error;
  }
}
