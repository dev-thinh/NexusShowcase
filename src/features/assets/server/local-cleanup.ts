import { constants } from 'node:fs';
import { lstat, open, unlink, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { assertAssetPath } from './asset-path';

/** Called only after the registry claim and complete reference recheck. */
export async function deleteRegisteredLocalAsset(root: string, url: string): Promise<void> {
  assertAssetPath(url);
  // Node lacks unlinkat: Linux proc descriptors pin each directory against rename
  // and symlink swaps. Refuse unsupported platforms rather than weaken deletion.
  if (process.platform !== 'linux') throw new Error('Safe local cleanup requires Linux proc descriptors');
  const relative = url.slice('/uploads/'.length);
  const targets = [path.join('storage', relative), ...(!url.startsWith('/uploads/resources/') ? [path.join('public/uploads', relative)] : [])];
  const handles: FileHandle[] = [];
  const existing: Array<{ filename: string; ino: number; dev: number; size: number; mtimeMs: number }> = [];
  try {
    // Open every ancestor from the filesystem root with O_NOFOLLOW.
    const directory = async (base: string, part: string) => {
      const target = path.join(base, part);
      if ((await lstat(target)).isSymbolicLink()) throw new Error('Refusing symlink asset path');
      const handle = await open(target, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
      handles.push(handle);
      return `/proc/self/fd/${handle.fd}`;
    };
    let base = '/';
    for (const part of path.resolve(root).split('/').filter(Boolean)) base = await directory(base, part);
    for (const target of targets) {
      let parent = base;
      const parts = target.split(path.sep);
      try {
        for (const part of parts.slice(0, -1)) parent = await directory(parent, part);
        const filename = path.join(parent, parts.at(-1)!);
        const stat = await lstat(filename);
        if (stat.isSymbolicLink()) throw new Error('Refusing symlink asset file');
        if (!stat.isFile() || stat.nlink !== 1) throw new Error('Invalid asset file');
        existing.push({ filename, ino: stat.ino, dev: stat.dev, size: stat.size, mtimeMs: stat.mtimeMs });
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    // Never recurse, create directories, or traverse unregistered files. Unlink
    // affects this directory entry only, even if the entry changes after lstat.
    for (const file of existing) {
      const current = await lstat(file.filename);
      if (!current.isFile() || current.nlink !== 1 || current.ino !== file.ino || current.dev !== file.dev || current.size !== file.size || current.mtimeMs !== file.mtimeMs) throw new Error('Asset file identity changed; deletion refused');
      await unlink(file.filename);
    }
  } finally { await Promise.all(handles.map(handle => handle.close())); }
}
