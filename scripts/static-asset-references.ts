import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertAssetPath } from '../src/features/assets/server/asset-path';

/** Preserve concrete checked-in references; runtime path fragments are not objects. */
export async function staticAssetReferences(root: string): Promise<Set<string>> {
  const urls = new Set<string>();
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Cannot prove static asset references through symlinks');
      if (entry.isDirectory()) { await visit(filename); continue; }
      if (!/\.(?:tsx?|mjs|json|css|md)$/.test(entry.name)) continue;
      const text = await readFile(filename, 'utf8');
      for (const match of text.matchAll(/\/uploads\/(?:thumbnails|documents|resources)\/[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}(?=[\s"'`<>?#)\]}]|$)/g)) {
        assertAssetPath(match[0]);
        urls.add(match[0]);
      }
    }
  }
  for (const directory of ['src', 'prisma']) await visit(path.join(root, directory));
  return urls;
}
