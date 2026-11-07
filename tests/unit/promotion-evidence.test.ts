import { afterEach, expect, it, vi } from 'vitest';
import { assertPromotionSource, readDevCi, verifyMergedPromotion, waitForPr } from '../../ops/production/promotion.mjs';
import { verifyCi } from '../../ops/production/verify-ci.mjs';
afterEach(() => vi.unstubAllGlobals());
const repository = 'dev-thinh/NexusShowcase';
const head = 'a'.repeat(40), main = 'b'.repeat(40), merged = 'c'.repeat(40), tree = 'd'.repeat(40);
const pr = () => ({ number: 7, state: 'open', merged: false, head: { ref: 'dev', sha: head, repo: { full_name: repository } }, base: { ref: 'main', sha: main, repo: { full_name: repository } } });
const run = () => ({ id: 123, event: 'push', head_branch: 'dev', head_sha: head, path: '.github/workflows/ci.yml', repository: { full_name: repository }, head_repository: { full_name: repository }, status: 'completed', conclusion: 'success' });
const jobs = () => ['check (ubuntu-latest)', 'check (windows-latest)', 'database-and-browser'].map(name => ({ name, head_sha: head, status: 'completed', conclusion: 'success' }));
function fixture() {
  const data: Record<string, unknown> = {
    [`/actions/workflows/ci.yml/runs?branch=dev&event=push&head_sha=${head}&per_page=100`]: { total_count: 1, workflow_runs: [run()] },
    '/actions/runs/123/jobs?filter=latest&per_page=100': { total_count: 3, jobs: jobs() },
    '/pulls/7': pr(), '/git/ref/heads/main': { object: { sha: main } },
    [`/compare/${main}...${head}`]: { merge_base_commit: { sha: main } },
    [`/git/commits/${merged}`]: { sha: merged, tree: { sha: tree }, parents: [{ sha: main }, { sha: head }] },
    [`/git/commits/${head}`]: { sha: head, tree: { sha: tree } },
    [`/commits/${merged}/pulls?per_page=100`]: [{ ...pr(), state: 'closed', merged_at: '2026-11-07', merge_commit_sha: merged }],
  };
  const get = vi.fn(async (suffix: string) => { if (!(suffix in data)) throw Error(`Unexpected URL ${suffix}`); return data[suffix]; });
  return { data, get };
}
it('rejects forks, other branches and malformed identities', () => {
  expect(() => assertPromotionSource(pr(), repository)).not.toThrow();
  for (const headChange of [{ ref: 'feature' }, { repo: { full_name: 'fork/repo' } }, { sha: 'unsafe' }, { repo: null }]) {
    expect(() => assertPromotionSource({ ...pr(), head: { ...pr().head, ...headChange } }, repository)).toThrow();
  }
});
it('requires every exact-SHA CI job to pass on the latest dev push run', async () => {
  const f = fixture();
  expect(await readDevCi(f.get, head)).toMatchObject({ id: 123 });
  f.data['/actions/runs/123/jobs?filter=latest&per_page=100'] = { total_count: 3, jobs: jobs().map(job => ({ ...job, conclusion: 'skipped' })) };
  await expect(readDevCi(f.get, head)).rejects.toThrow();
});
it('never reuses an older success while a newer run is pending or failed', async () => {
  const f = fixture(), key = `/actions/workflows/ci.yml/runs?branch=dev&event=push&head_sha=${head}&per_page=100`;
  f.data[key] = { total_count: 2, workflow_runs: [run(), { ...run(), id: 124, status: 'in_progress', conclusion: null }] };
  expect(await readDevCi(f.get, head)).toBeNull();
  f.data[key] = { total_count: 2, workflow_runs: [run(), { ...run(), id: 124, conclusion: 'failure' }] };
  await expect(readDevCi(f.get, head)).rejects.toThrow();
});
it('waits for a running CI and succeeds when that same commit finishes', async () => {
  const f = fixture(), key = `/actions/workflows/ci.yml/runs?branch=dev&event=push&head_sha=${head}&per_page=100`;
  f.data[key] = { total_count: 1, workflow_runs: [{ ...run(), status: 'in_progress', conclusion: null }] };
  const sleep = vi.fn(async () => { f.data[key] = { total_count: 1, workflow_runs: [run()] }; });
  await expect(waitForPr(f.get, pr(), { sleep, timeoutMs: 1000 })).resolves.toMatchObject({ id: 123 });
  expect(sleep).toHaveBeenCalledTimes(1);
});
it('rejects a new PR head or stale main rather than applying old success', async () => {
  const f = fixture(); f.data['/pulls/7'] = { ...pr(), head: { ...pr().head, sha: 'e'.repeat(40) } };
  await expect(waitForPr(f.get, pr())).rejects.toThrow();
  f.data['/pulls/7'] = pr(); f.data[`/compare/${main}...${head}`] = { merge_base_commit: { sha: 'f'.repeat(40) } };
  await expect(waitForPr(f.get, pr())).rejects.toThrow();
});
it('fails closed when CI never appears', async () => {
  const f = fixture(); f.data[`/actions/workflows/ci.yml/runs?branch=dev&event=push&head_sha=${head}&per_page=100`] = { total_count: 0, workflow_runs: [] };
  let now = 0;
  await expect(waitForPr(f.get, pr(), { now: () => now, timeoutMs: 1, sleep: async () => { now += 2; } })).rejects.toThrow(/Timed out/);
});
it('accepts a merged same-repository dev PR only when its tree matches tested dev', async () => {
  const f = fixture(); f.data['/git/ref/heads/main'] = { object: { sha: merged } };
  await expect(verifyMergedPromotion(f.get, merged)).resolves.toMatchObject({ headSha: head, runId: 123 });
  f.data[`/git/commits/${head}`] = { tree: { sha: 'f'.repeat(40) } };
  await expect(verifyMergedPromotion(f.get, merged)).rejects.toThrow();
});
it('rejects direct pushes, squash merges and untested source parents', async () => {
  for (const changes of [
    { [`/commits/${merged}/pulls?per_page=100`]: [] },
    { [`/git/commits/${merged}`]: { tree: { sha: tree }, parents: [{ sha: main }] } },
    { [`/git/commits/${merged}`]: { tree: { sha: tree }, parents: [{ sha: main }, { sha: 'f'.repeat(40) }] } },
  ]) {
    const f = fixture(); f.data['/git/ref/heads/main'] = { object: { sha: merged } }; Object.assign(f.data, changes);
    await expect(verifyMergedPromotion(f.get, merged)).rejects.toThrow();
  }
});

it.each([
  { head_sha: 'f'.repeat(40) }, { event: 'pull_request' }, { head_branch: 'main' },
  { repository: { full_name: 'fork/repo' } }, { path: '.github/workflows/fake.yml' },
])('rejects dev CI metadata mismatch: %j', async change => {
  const f = fixture(); f.data[`/actions/workflows/ci.yml/runs?branch=dev&event=push&head_sha=${head}&per_page=100`] = { total_count: 1, workflow_runs: [{ ...run(), ...change }] };
  await expect(readDevCi(f.get, head)).rejects.toThrow();
});
it('rejects required jobs from another SHA and duplicate required jobs', async () => {
  for (const entries of [jobs().map(job => ({ ...job, head_sha: main })), [...jobs(), jobs()[0]]]) {
    const f = fixture(); f.data['/actions/runs/123/jobs?filter=latest&per_page=100'] = { total_count: entries.length, jobs: entries };
    await expect(readDevCi(f.get, head)).rejects.toThrow();
  }
});
it('the server independently verifies dev evidence even after the main preflight passes', async () => {
  const f = fixture(); f.data['/git/ref/heads/main'] = { object: { sha: merged } };
  f.data['/actions/runs/456'] = { ...run(), id: 456, head_branch: 'main', head_sha: merged, status: 'in_progress', conclusion: null };
  f.data['/actions/runs/456/jobs?filter=latest&per_page=100'] = { total_count: 1, jobs: [{ name: 'verify-promotion', status: 'completed', conclusion: 'success' }] };
  vi.stubGlobal('fetch', async (url: string) => ({ ok: true, json: () => f.get(url.replace(`https://api.github.com/repos/${repository}`, '')) }));
  await expect(verifyCi(merged, '456')).resolves.toBeUndefined();
  f.data['/actions/runs/123/jobs?filter=latest&per_page=100'] = { total_count: 0, jobs: [] };
  await expect(verifyCi(merged, '456')).rejects.toThrow();
});
