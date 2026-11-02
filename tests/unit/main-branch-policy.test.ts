import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

const workflowPath = '.github/workflows/main-source-policy.yml';
const repository = 'dev-thinh/NexusShowcase';
function checkSource(head = 'dev', headRepository: string | null = repository, base = 'main', baseRepository = repository) {
  const workflow = readFileSync(workflowPath, 'utf8');
  const body = workflow.split('        run: |\n')[1];
  if (!body) throw new Error('Missing policy script');
  const script = body.split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const directory = mkdtempSync(path.join(tmpdir(), 'nexus-main-policy-'));
  try {
    const event = path.join(directory, 'event.json');
    writeFileSync(event, JSON.stringify(head === '' ? {} : { pull_request: {
      base: { ref: base, repo: { full_name: baseRepository } },
      head: { ref: head, repo: headRepository ? { full_name: headRepository } : null },
    } }));
    return spawnSync(process.execPath, ['-e', script], {
      env: { ...process.env, GITHUB_EVENT_PATH: event, GITHUB_REPOSITORY: repository }, encoding: 'utf8',
    });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

it('accepts a dev to main pull request from this repository', () => {
  expect(checkSource().status).toBe(0);
});
it.each(['feature/change', 'main', 'Dev', 'dev; echo unexpected', ''])('rejects a non-dev source or missing PR: %s', head => {
  expect(checkSource(head).status).toBe(1);
});
it('rejects a fork named dev and a deleted source repository', () => {
  expect(checkSource('dev', 'someone/NexusShowcase').status).toBe(1);
  expect(checkSource('dev', null).status).toBe(1);
});
it('rejects a wrong target branch or repository', () => {
  expect(checkSource('dev', repository, 'release').status).toBe(1);
  expect(checkSource('dev', repository, 'main', 'someone/NexusShowcase').status).toBe(1);
});
it('reruns when a PR is retargeted and does not check out or execute PR code', () => {
  const workflow = readFileSync(workflowPath, 'utf8');
  expect(workflow).toContain('edited');
  expect(workflow).toContain('main-source-policy:');
  expect(workflow).not.toContain('actions/checkout');
  expect(workflow).toContain('  pull_request_target:');
  expect(workflow).toContain('permissions: {}');
  expect(workflow).not.toMatch(/^  pull_request:/m);
  expect(workflow).not.toContain('secrets.');
});
