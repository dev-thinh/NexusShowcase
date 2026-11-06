import { readFileSync, mkdtempSync, writeFileSync, chmodSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
function extractDeploy(source: string) {
  return source.replace(/\r\n/g, '\n').split('\n  deploy:\n')[1] ?? '';
}
const deploy = extractDeploy(workflow);
const run = deploy.match(/      - name: Deploy exact checked commit[\s\S]*?        run: \|\n([\s\S]*)$/)?.[1]?.replace(/^          /gm, '') ?? '';

describe('production deployment workflow', () => {
  it('extracts identical deployment configuration from Windows CRLF checkouts', () => {
    expect(deploy).not.toBe('');
    expect(extractDeploy(workflow.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'))).toBe(deploy);
  });
  it('requires verified promotion and permits only explicitly enabled main pushes', () => {
    expect(deploy).toContain('needs: [verify-promotion]');
    const condition = deploy.match(/    if: \$\{\{ (.*) \}\}/)?.[1];
    expect(condition).toBeDefined();
    for (const event of ['push', 'pull_request']) {
      for (const ref of ['refs/heads/main', 'refs/heads/dev']) {
        for (const flag of ['true', 'false', '']) {
          const expression = condition!.replaceAll('github.event_name', JSON.stringify(event)).replaceAll('github.ref', JSON.stringify(ref)).replaceAll('vars.PRODUCTION_DEPLOY_ENABLED', JSON.stringify(flag));
          expect(Function(`return (${expression})`)()).toBe(event === 'push' && ref === 'refs/heads/main' && flag === 'true');
        }
      }
    }
    expect(deploy).toContain('cancel-in-progress: false');
    expect(deploy).toContain('id-token: write');
    expect(deploy).toContain('tailscale/github-action@064b10558093f38325e838ddea35486bdc6b1d5c # v4');
    expect(deploy).toContain('timeout-minutes: 45');
    expect(deploy).not.toMatch(/actions\/checkout|npm |ssh-keyscan|StrictHostKeyChecking=no/);
  });

  it.skipIf(process.platform === 'win32')('passes only validated identifiers and pinned private credentials to SSH, then cleans up', () => {
    expect(run).not.toBe('');
    const directory = mkdtempSync(join(tmpdir(), 'cd-test-'));
    try {
      const stub = join(directory, 'ssh');
      writeFileSync(stub, '#!/bin/bash\nset -eu\nprintf "%s\\n" "$@" > "$CAPTURE"\nfor f in "$RUNNER_TEMP"/nexus-deploy.*/{key,known_hosts}; do stat -c "%a" "$f"; done\n');
      chmodSync(stub, 0o700);
      const env = { ...process.env, PATH: `${directory}:${process.env.PATH}`, RUNNER_TEMP: directory, CAPTURE: join(directory, 'args'), DEPLOY_SSH_KEY: 'private-test-key', DEPLOY_KNOWN_HOSTS: '[100.69.69.4]:2222 ssh-ed25519 test', DEPLOY_HOST: '100.69.69.4', GITHUB_SHA: 'a'.repeat(40), GITHUB_RUN_ID: '12345' };
      const result = spawnSync('bash', ['-c', run], { env, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.trim().split('\n')).toEqual(['600', '600']);
      expect(result.stdout + result.stderr).not.toContain('private-test-key');
      const args = readFileSync(env.CAPTURE, 'utf8');
      for (const option of ['BatchMode=yes', 'IdentitiesOnly=yes', 'StrictHostKeyChecking=yes', 'ServerAliveInterval=30', 'ServerAliveCountMax=6', 'nexusdeploy@100.69.69.4', `deploy ${env.GITHUB_SHA} 12345`]) expect(args).toContain(option);
      const key = args.split('\n').find((arg) => arg.endsWith('/key'))!;
      expect(existsSync(key)).toBe(false);
      writeFileSync(stub, '#!/bin/bash\nexit 42\n');
      expect(spawnSync('bash', ['-c', run], { env, encoding: 'utf8' }).status).toBe(42);
      expect(existsSync(key)).toBe(false);
      expect(readdirSync(directory).filter((name) => name.startsWith('nexus-deploy.'))).toEqual([]);
      rmSync(env.CAPTURE);
      for (const invalid of [{ GITHUB_SHA: '$(touch bad)' }, { GITHUB_RUN_ID: '1; id' }, { DEPLOY_HOST: '-oProxyCommand=id' }]) {
        expect(spawnSync('bash', ['-c', run], { env: { ...env, ...invalid }, encoding: 'utf8' }).status).not.toBe(0);
        expect(existsSync(env.CAPTURE)).toBe(false);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

it('runs full CI only on dev pushes and only verifies evidence on main', () => {
  expect(workflow).toContain('branches: [dev, main]');
  expect(workflow).not.toContain('pull_request');
  for (const job of ['check', 'database-and-browser']) {
    const block = workflow.split(`\n  ${job}:\n`)[1].split(/\n  [a-z][a-z-]+:\n/)[0];
    expect(block).toContain("if: ${{ github.ref == 'refs/heads/dev' }}");
  }
  const promotion = workflow.split('\n  verify-promotion:\n')[1].split('\n  deploy:\n')[0];
  expect(promotion).toContain("if: ${{ github.ref == 'refs/heads/main' }}");
  expect(promotion).toContain('node ops/production/promotion.mjs main');
  expect(promotion).not.toMatch(/npm |test:e2e|test:integration/);
});
