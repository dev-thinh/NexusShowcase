import { mkdtemp, mkdir, readFile, readlink, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertDeploymentIdentity, validateCiEvidence, validateDatabaseTargets, validateFreshBackup } from '../../ops/production/verify-ci.mjs';
import { promoteRelease } from '../../ops/production/release.mjs';

const sha = 'a'.repeat(40);
function evidence() {
  return {
    id: 123, event: 'push', head_branch: 'main', head_sha: sha,
    path: '.github/workflows/ci.yml', conclusion: null,
    repository: { full_name: 'dev-thinh/NexusShowcase' },
    head_repository: { full_name: 'dev-thinh/NexusShowcase' },
  };
}
const jobs = ['check (ubuntu-latest)', 'check (windows-latest)', 'database-and-browser'].map(name => ({ name, status: 'completed', conclusion: 'success' }));
it('requires successful CI jobs for the exact main push while CD is still in progress', () => {
  expect(() => validateCiEvidence(evidence(), jobs, sha, '123')).not.toThrow();
});
it.each([
  { event: 'pull_request' }, { head_branch: 'dev' }, { head_sha: 'b'.repeat(40) },
  { path: '.github/workflows/untrusted.yml' }, { id: 456 }, { conclusion: 'cancelled' },
  { repository: { full_name: 'other/project' } }, { head_repository: { full_name: 'fork/project' } },
])('rejects mismatched or cancelled CI evidence: %j', change => {
  expect(() => validateCiEvidence({ ...evidence(), ...change }, jobs, sha, '123')).toThrow();
});
it('rejects skipped, missing and failed required jobs', () => {
  for (const conclusion of ['skipped', 'failure', null]) {
    expect(() => validateCiEvidence(evidence(), [{ ...jobs[0], conclusion }, ...jobs.slice(1)], sha, '123')).toThrow();
  }
  expect(() => validateCiEvidence(evidence(), jobs.slice(1), sha, '123')).toThrow();
});
it.each(['main', '../main', 'A'.repeat(40), `${sha};id`, ''])('rejects an unsafe SHA: %s', value => {
  expect(() => assertDeploymentIdentity(value, '123')).toThrow();
});
it.each(['0', '-1', '001', '123;id', '', '1'.repeat(21)])('rejects an unsafe run ID: %s', value => {
  expect(() => assertDeploymentIdentity(sha, value)).toThrow();
});
it('limits both database URLs to the dedicated container and roles', () => {
  const runtime = 'DATABASE_URL="postgresql://nexus_runtime:private@127.0.0.1:55432/nexus_showcase?schema=public"';
  const migration = 'MIGRATION_DATABASE_URL="postgresql://nexus_admin:private@127.0.0.1:55432/nexus_showcase?schema=public"';
  expect(() => validateDatabaseTargets(runtime, migration)).not.toThrow();
  expect(() => validateDatabaseTargets(runtime.replace('55432', '5434'), migration)).toThrow();
  expect(() => validateDatabaseTargets(runtime, migration.replace('nexus_showcase?', 'other?'))).toThrow();
  expect(() => validateDatabaseTargets(runtime.replace('?schema=public', '?schema=public&host=/tmp'), migration)).toThrow();
});

it('requires a fresh completed successful oneshot backup rather than an active no-op', () => {
  const before = { Type: 'oneshot', RemainAfterExit: 'no', ExecMainStartTimestampMonotonic: '100' };
  const after = { ...before, ExecMainStartTimestampMonotonic: '200', Result: 'success', ExecMainStatus: '0', ActiveState: 'inactive' };
  expect(() => validateFreshBackup(before, after)).not.toThrow();
  for (const change of [{ ExecMainStartTimestampMonotonic: '100' }, { RemainAfterExit: 'yes' }, { Type: 'simple' }, { Result: 'exit-code' }, { ExecMainStatus: '1' }, { ActiveState: 'active' }]) {
    expect(() => validateFreshBackup(before, { ...after, ...change })).toThrow();
  }
});

describe.skipIf(process.platform === 'win32')('Linux release promotion', () => {
  async function fixture() {
    const root = await mkdtemp(path.join(tmpdir(), 'nexus-release-'));
    await mkdir(path.join(root, 'releases'));
    const previous = path.join(root, 'releases', 'previous');
    const candidate = path.join(root, 'releases', 'candidate');
    await mkdir(previous); await mkdir(candidate);
    await writeFile(path.join(previous, '.release-sha'), 'b'.repeat(40));
    await writeFile(path.join(candidate, '.release-sha'), sha);
    await symlink(previous, path.join(root, 'current'));
    return { root, previous, candidate, rollbackHealth: async () => 'verified' };
  }
  it.each(['backup', 'migrate', 'probe'])('keeps the running symlink unchanged when %s fails', async failure => {
    const f = await fixture(); const calls: string[] = [];
    const phase = (name: string) => async () => { calls.push(name); if (name === failure) throw new Error('private credential must not escape'); };
    try {
      await expect(promoteRelease({ ...f, sha, backup: phase('backup'), migrate: phase('migrate'), probe: phase('probe'), restart: phase('restart'), health: phase('health') })).rejects.toThrow();
      expect(await readlink(path.join(f.root, 'current'))).toBe(f.previous);
      expect(calls).not.toContain('restart');
      expect(calls).toEqual(['backup', 'migrate', 'probe'].slice(0, ['backup', 'migrate', 'probe'].indexOf(failure) + 1));
    } finally { await rm(f.root, { recursive: true, force: true }); }
  });
  it('switches only after backup, migration and probe, then verifies the new release', async () => {
    const f = await fixture(); const calls: string[] = [];
    const phase = (name: string) => async () => { calls.push(name); };
    try {
      await promoteRelease({ ...f, sha, backup: phase('backup'), migrate: phase('migrate'), probe: phase('probe'), restart: async () => { calls.push('restart'); expect(await readlink(path.join(f.root, 'current'))).toBe(f.candidate); }, health: phase('health') });
      expect(calls).toEqual(['backup', 'migrate', 'probe', 'restart', 'health']);
      expect(await readlink(path.join(f.root, 'current'))).toBe(f.candidate);
    } finally { await rm(f.root, { recursive: true, force: true }); }
  });
  it('restores the previous symlink and restarts it after new health fails', async () => {
    const f = await fixture(); let restarts = 0;
    try {
      await expect(promoteRelease({ ...f, sha, backup: async () => {}, migrate: async () => {}, probe: async () => {}, restart: async () => { restarts++; }, health: async () => { throw new Error('SECRET_DATABASE_URL'); } })).rejects.toThrow('Previous release restored');
      expect(await readlink(path.join(f.root, 'current'))).toBe(f.previous);
      expect(restarts).toBe(2);
      expect(await readFile(path.join(f.previous, '.release-sha'), 'utf8')).toBe('b'.repeat(40));
    } finally { await rm(f.root, { recursive: true, force: true }); }
  });
  it('reports a rollback restart failure without claiming recovery', async () => {
    const f = await fixture();
    try {
      await expect(promoteRelease({ ...f, sha, backup: async () => {}, migrate: async () => {}, probe: async () => {}, restart: async () => { throw new Error('SECRET'); }, health: async () => {} })).rejects.toThrow('Rollback restart failed');
      expect(await readlink(path.join(f.root, 'current'))).toBe(f.previous);
    } finally { await rm(f.root, { recursive: true, force: true }); }
  });
  it('does not claim recovery when the previous app fails health after restart', async () => {
    const f = await fixture();
    try {
      await expect(promoteRelease({ ...f, sha, backup: async () => {}, migrate: async () => {}, probe: async () => {}, restart: async () => {}, health: async () => { throw new Error('new app failed'); }, rollbackHealth: async (previousSha: string) => { expect(previousSha).toBe('b'.repeat(40)); throw new Error('old app failed'); } })).rejects.toThrow('Rollback health failed');
      expect(await readlink(path.join(f.root, 'current'))).toBe(f.previous);
    } finally { await rm(f.root, { recursive: true, force: true }); }
  });
  it('refuses a current symlink outside this project before invoking any phase', async () => {
    const f = await fixture(); let touched = false;
    try {
      await rm(path.join(f.root, 'current'));
      await symlink(tmpdir(), path.join(f.root, 'current'));
      const phase = async () => { touched = true; };
      await expect(promoteRelease({ ...f, sha, backup: phase, migrate: phase, probe: phase, restart: phase, health: phase })).rejects.toThrow();
      expect(touched).toBe(false);
    } finally { await rm(f.root, { recursive: true, force: true }); }
  });
});
