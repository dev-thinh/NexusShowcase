import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const repository = 'dev-thinh/NexusShowcase';
const shaPattern = /^[a-f0-9]{40}$/;
const requiredJobs = ['check (ubuntu-latest)', 'check (windows-latest)', 'database-and-browser'];

export function assertPromotionSource(pr, expectedRepository = repository) {
  if (expectedRepository !== repository || pr?.base?.ref !== 'main' || pr.base.repo?.full_name !== repository ||
      pr.head?.ref !== 'dev' || pr.head.repo?.full_name !== repository || !shaPattern.test(pr.head.sha ?? '')) {
    throw new Error('Only a same-repository dev -> main PR with a valid head SHA may promote');
  }
}

export function githubGet(token = process.env.GITHUB_TOKEN) {
  return async suffix => {
    const response = await fetch(`https://api.github.com/repos/${repository}${suffix}`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'roboticslab-promotion', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GitHub verification request failed (${response.status})`);
    return response.json();
  };
}

export async function readDevCi(get, sha) {
  if (!shaPattern.test(sha ?? '')) throw new Error('Invalid dev SHA');
  const result = await get(`/actions/workflows/ci.yml/runs?branch=dev&event=push&head_sha=${sha}&per_page=100`);
  if (!Array.isArray(result.workflow_runs) || result.total_count > 100) throw new Error('Unexpected dev CI inventory');
  const runs = result.workflow_runs;
  const run = [...runs].sort((a, b) => b.id - a.id)[0];
  if (!run) return null;
  if (!Number.isSafeInteger(run.id) || run.id <= 0 || run.event !== 'push' || run.head_branch !== 'dev' || run.head_sha !== sha ||
      run.path !== '.github/workflows/ci.yml' || run.repository?.full_name !== repository || run.head_repository?.full_name !== repository) {
    throw new Error('CI evidence does not identify this dev push');
  }
  if (run.status !== 'completed') return null;
  if (run.conclusion !== 'success') throw new Error(`Latest dev CI did not pass (${run.conclusion})`);
  const inventory = await get(`/actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
  if (!Array.isArray(inventory.jobs) || inventory.total_count > 100) throw new Error('Unexpected CI job inventory');
  for (const name of requiredJobs) {
    const matching = inventory.jobs.filter(job => job.name === name);
    if (matching.length !== 1 || matching[0].head_sha !== sha || matching[0].status !== 'completed' || matching[0].conclusion !== 'success') {
      throw new Error(`Required dev CI job did not pass: ${name}`);
    }
  }
  return run;
}

async function assertUpToDate(get, baseSha, headSha) {
  if (!shaPattern.test(baseSha ?? '')) throw new Error('Invalid main SHA');
  const comparison = await get(`/compare/${baseSha}...${headSha}`);
  if (comparison.merge_base_commit?.sha !== baseSha) throw new Error('Update dev from main and rerun CI before merging');
}

export async function waitForPr(get, initial, { sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now, timeoutMs = 50 * 60_000, log = console.log } = {}) {
  assertPromotionSource(initial);
  if (!Number.isSafeInteger(initial.number) || initial.number <= 0) throw new Error('Invalid PR number');
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    const current = await get(`/pulls/${initial.number}`);
    assertPromotionSource(current);
    if (current.state !== 'open' || current.head.sha !== initial.head.sha) throw new Error('PR closed or superseded by a newer commit');
    const run = await readDevCi(get, current.head.sha);
    if (run) {
      const main = await get('/git/ref/heads/main');
      await assertUpToDate(get, main.object?.sha, current.head.sha);
      // Bind success to the still-current PR head after checking CI and ancestry.
      const latest = await get(`/pulls/${initial.number}`);
      assertPromotionSource(latest);
      if (latest.state !== 'open' || latest.head.sha !== initial.head.sha) throw new Error('PR changed during verification');
      log(`Verified dev CI run ${run.id} for ${current.head.sha}`);
      return run;
    }
    log('Waiting for CI of the exact dev commit; no test suite is rerun here.');
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for dev CI; rerun this gate once CI finishes');
}

export async function verifyMergedPromotion(get, sha) {
  if (!shaPattern.test(sha ?? '')) throw new Error('Invalid merge SHA');
  const [main, commit, linked] = await Promise.all([get('/git/ref/heads/main'), get(`/git/commits/${sha}`), get(`/commits/${sha}/pulls?per_page=100`)]);
  if (main.object?.sha !== sha) throw new Error('Deployment is no longer the current main commit');
  if (!Array.isArray(linked) || linked.length >= 100) throw new Error('Unexpected promotion PR inventory');
  const matching = linked.filter(pr => pr.state === 'closed' && pr.merged_at && pr.merge_commit_sha === sha && pr.base?.ref === 'main');
  if (matching.length !== 1) throw new Error('Main commit must come from one merged dev PR');
  const pr = matching[0];
  assertPromotionSource(pr);
  if (commit.parents?.length !== 2 || commit.parents[1].sha !== pr.head.sha) throw new Error('Use Create a merge commit for dev promotion');
  const source = await get(`/git/commits/${pr.head.sha}`);
  if (!shaPattern.test(commit.tree?.sha ?? '') || commit.tree.sha !== source.tree?.sha) throw new Error('Merged tree differs from the tested dev tree');
  await assertUpToDate(get, commit.parents[0].sha, pr.head.sha);
  const run = await readDevCi(get, pr.head.sha);
  if (!run) throw new Error('Dev CI must finish successfully before deployment');
  return { headSha: pr.head.sha, runId: run.id, pullRequest: pr.number };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const get = githubGet();
    if (process.argv[2] === 'pr') {
      const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
      assertPromotionSource(event.pull_request, process.env.GITHUB_REPOSITORY);
      await waitForPr(get, event.pull_request);
    } else if (process.argv[2] === 'main') {
      console.log(await verifyMergedPromotion(get, process.argv[3]));
    } else throw new Error('Expected pr or main verification mode');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
