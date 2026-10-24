import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type LocalImage = { filename: string; url: string; sha256: string };
export const imageDigest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
export async function inventoryLocalImages(root: string): Promise<LocalImage[]> {
  const targets: LocalImage[] = [];
  for (const [relative, prefix] of [['public/uploads/thumbnails', '/uploads/thumbnails/'], ['public/images/moments', '/images/moments/'], ['storage/resources', '/uploads/resources/']]) {
    let directory = root;
    let missing = false;
    for (const part of relative.split('/')) {
      directory = path.join(directory, part);
      try { if ((await lstat(directory)).isSymbolicLink()) throw new Error('Refusing symlink image directory'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') { missing = true; break; } throw error; }
    }
    if (missing) continue;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !/^[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif|svg)$/i.test(entry.name)) continue;
      const filename = path.resolve(directory, entry.name);
      const relativeTarget = path.relative(path.resolve(root), filename);
      if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) throw new Error('Image path outside workspace');
      targets.push({ filename, url: prefix + entry.name, sha256: imageDigest(await readFile(filename)) });
    }
  }
  return targets;
}

/** Only exact inventoried photo URLs are removed; documents, external images and text remain. */
export function clearLocalImageReferences(value: unknown, targets: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) return value.filter(entry => {
    if (typeof entry === 'string') return !targets.has(entry);
    if (!entry || typeof entry !== 'object') return true;
    return !['src', 'url', 'fileUrl'].some(key => typeof (entry as Record<string, unknown>)[key] === 'string' && targets.has((entry as Record<string, string>)[key]));
  }).map(entry => clearLocalImageReferences(entry, targets));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clearLocalImageReferences(entry, targets)]));
  if (typeof value !== 'string') return value;
  if (targets.has(value)) return null;
  const prefix = value.startsWith('nexus-sections:v1\n') ? 'nexus-sections:v1\n' : '';
  const structured = value.slice(prefix.length);
  if (prefix || structured.startsWith('{') || structured.startsWith('[')) {
    let parsed: unknown;
    try { parsed = JSON.parse(structured); } catch { if (prefix) throw new Error('Invalid structured article during image cleanup'); return value; }
    const next = clearLocalImageReferences(parsed, targets);
    if (JSON.stringify(next) !== JSON.stringify(parsed)) return prefix + JSON.stringify(next);
  }
  return value;
}
