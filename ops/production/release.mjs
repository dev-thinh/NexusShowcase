import { lstat, readFile, realpath, rename, symlink, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function releasePaths(root, candidate) {
  const current = path.join(root, 'current');
  if (!(await lstat(current)).isSymbolicLink()) throw new Error('Production current path must be a symlink');
  const releases = await realpath(path.join(root, 'releases'));
  const [previous, next] = await Promise.all([realpath(current), realpath(candidate)]);
  for (const release of [previous, next]) {
    if (!release.startsWith(`${releases}${path.sep}`) || release === releases) throw new Error('Release is outside this project');
  }
  return { current, previous, next };
}

async function point(current, target) {
  const temporary = `${current}.switch-${randomUUID()}`;
  try {
    await symlink(target, temporary);
    await rename(temporary, current);
  } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

export async function promoteRelease({ root, candidate, sha, backup, migrate, probe, restart, health, rollbackHealth }) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid release SHA');
  const { current, previous, next } = await releasePaths(root, candidate);
  const previousSha = (await readFile(path.join(previous, '.release-sha'), 'utf8')).trim();
  if (!/^[a-f0-9]{40}$/.test(previousSha) || typeof rollbackHealth !== 'function') throw new Error('Invalid rollback health configuration');
  await backup();
  await migrate();
  await probe();
  await point(current, next);
  try {
    await restart();
    await health(sha);
  } catch {
    try {
      await point(current, previous);
      await restart();
    } catch { throw new Error('Rollback restart failed; operator intervention required. Database was not restored.'); }
    let rollbackStatus;
    try { rollbackStatus = await rollbackHealth(previousSha, previous); }
    catch { throw new Error('Rollback health failed after restoring previous pointer; operator intervention required. Database was not restored.'); }
    if (rollbackStatus === 'bootstrap-http-only') throw new Error('Bootstrap release restarted and HTTP responds; exact release and DB health are unverified. Database was not restored.');
    throw new Error('Previous release restored and health verified after activation failed. Database was not restored.');
  }
}
