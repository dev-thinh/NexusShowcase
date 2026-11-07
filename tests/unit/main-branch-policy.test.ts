import { readFileSync } from 'node:fs';
import { assertPromotionSource } from '../../ops/production/promotion.mjs';
import { expect, it } from 'vitest';

const workflowPath = '.github/workflows/main-source-policy.yml';
const repository = 'dev-thinh/NexusShowcase';
function checkSource(head = 'dev', headRepository: string | null = repository, base = 'main', baseRepository = repository, _lineEnding = '\n') {
  try {
    assertPromotionSource(head === '' ? undefined : {
      base: { ref: base, repo: { full_name: baseRepository } },
      head: { ref: head, sha: 'a'.repeat(40), repo: headRepository ? { full_name: headRepository } : null },
    }, repository);
    return { status: 0 };
  } catch { return { status: 1 }; }
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
it('reruns when a PR is retargeted and only checks out policy code from the trusted workflow SHA', () => {
  const workflow = readFileSync(workflowPath, 'utf8');
  expect(workflow).toContain('edited');
  expect(workflow).toContain('main-source-policy:');
  expect(workflow).toContain('ref: ${{ github.workflow_sha }}');
  expect(workflow).toContain('persist-credentials: false');
  expect(workflow).not.toContain('github.event.pull_request.head');
  expect(workflow).toContain('  pull_request_target:');
  expect(workflow).toContain('  actions: read');
  expect(workflow).not.toContain(': write');
  expect(workflow).toContain('node ops/production/promotion.mjs pr');
  expect(workflow).not.toMatch(/^  pull_request:/m);
  expect(workflow).not.toContain('secrets.');
});

it('executes the policy from a Windows CRLF checkout', () => {
  const normalized = readFileSync(workflowPath, 'utf8').replace(/\r?\n/g, '\r\n').replace(/\r\n/g, '\n');
  expect(normalized).toContain('node ops/production/promotion.mjs pr');
});
