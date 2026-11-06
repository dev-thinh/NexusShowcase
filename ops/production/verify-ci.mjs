import { parseEnv } from 'node:util';

import { githubGet, verifyMergedPromotion } from './promotion.mjs';
export { repository } from './promotion.mjs';
import { repository } from './promotion.mjs';
const requiredJobs = ['verify-promotion'];

export function assertDeploymentIdentity(sha, runId) {
  if (!/^[a-f0-9]{40}$/.test(sha) || !/^[1-9][0-9]{0,19}$/.test(runId)) throw new Error('Invalid deployment identity');
}

export function validateCiEvidence(run, jobs, sha, runId) {
  assertDeploymentIdentity(sha, runId);
  if (String(run.id) !== runId || run.event !== 'push' || run.head_branch !== 'main' || run.head_sha !== sha ||
      run.path !== '.github/workflows/ci.yml' || run.repository?.full_name !== repository ||
      run.head_repository?.full_name !== repository || !['in_progress', 'completed'].includes(run.status) ||
      (run.conclusion !== null && run.conclusion !== 'success')) {
    throw new Error('CI evidence does not identify the requested main push');
  }
  for (const name of requiredJobs) {
    const matching = jobs.filter(job => job.name === name);
    if (matching.length !== 1 || matching[0].status !== 'completed' || matching[0].conclusion !== 'success') {
      throw new Error('Required CI job is not successful');
    }
  }
}

export function validateDatabaseTargets(runtimeText, maintenanceText) {
  const runtime = parseEnv(runtimeText).DATABASE_URL;
  const maintenance = parseEnv(maintenanceText).MIGRATION_DATABASE_URL;
  for (const [value, role] of [[runtime, 'nexus_runtime'], [maintenance, 'nexus_admin']]) {
    let url;
    try { url = new URL(value); } catch { throw new Error('Missing or invalid database configuration'); }
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || url.hostname !== '127.0.0.1' || url.port !== '55432' ||
        url.pathname !== '/nexus_showcase' || url.username !== role || url.hash ||
        url.searchParams.get('schema') !== 'public' || url.searchParams.getAll('schema').length !== 1 ||
        [...url.searchParams.keys()].some(key => key !== 'schema')) throw new Error('Database must target the dedicated NexusShowcase container');
  }
}

export async function verifyCi(sha, runId) {
  assertDeploymentIdentity(sha, runId);
  const get = githubGet();
  const [run, jobs] = await Promise.all([get(`/actions/runs/${runId}`), get(`/actions/runs/${runId}/jobs?filter=latest&per_page=100`)]);
  if (!Array.isArray(jobs.jobs) || jobs.total_count > 100) throw new Error('Unexpected CI job inventory');
  validateCiEvidence(run, jobs.jobs, sha, runId);
  await verifyMergedPromotion(get, sha);
}

export function validateFreshBackup(before, after) {
  for (const state of [before, after]) {
    if (state.Type !== 'oneshot' || state.RemainAfterExit !== 'no' || !/^[0-9]+$/.test(state.ExecMainStartTimestampMonotonic)) throw new Error('Unsafe backup service configuration');
  }
  if (BigInt(after.ExecMainStartTimestampMonotonic) <= BigInt(before.ExecMainStartTimestampMonotonic) ||
      after.Result !== 'success' || after.ExecMainStatus !== '0' || after.ActiveState !== 'inactive') {
    throw new Error('A fresh successful database backup is required');
  }
}
