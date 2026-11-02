import { spawn } from 'node:child_process';
import { appendFile, mkdir, mkdtemp, open, readFile, realpath, symlink, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { userInfo } from 'node:os';
import { randomUUID } from 'node:crypto';
import { assertDeploymentIdentity, repository, validateDatabaseTargets, validateFreshBackup, verifyCi } from './verify-ci.mjs';
import { promoteRelease, releasePaths } from './release.mjs';

const root = '/srv/nexusshowcase';
const tools = '/usr/local/libexec/nexusshowcase';
const node = '/opt/nexusshowcase/node/bin/node';
const service = 'nexusshowcase.service';
const [sha, runId] = process.argv.slice(2);
process.umask(0o077);
let stage = 'preflight';
let logFile;
const toolEnv = {
  ...process.env,
  HOME: path.join(root, 'home'),
  PATH: '/opt/nexusshowcase/node/bin:/usr/bin:/bin',
  XDG_RUNTIME_DIR: `/run/user/${process.getuid()}`,
  DBUS_SESSION_BUS_ADDRESS: `unix:path=/run/user/${process.getuid()}/bus`,
};

// Command output stays in a private server-side log, not in GitHub logs.
async function run(file, args, { cwd = root, capture = false, env = {} } = {}) {
  await appendFile(logFile, `\n[${stage}] ${path.basename(file)}\n`);
  const log = await open(logFile, 'a', 0o600);
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(file, args, { cwd, env: { ...toolEnv, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      let oversized = false;
      child.stdout.on('data', chunk => {
        log.write(chunk).catch(() => child.kill('SIGTERM'));
        if (capture) {
          output += chunk.toString();
          if (output.length > 65536) { oversized = true; child.kill('SIGTERM'); }
        }
      });
      child.stderr.on('data', chunk => { log.write(chunk).catch(() => child.kill('SIGTERM')); });
      child.once('error', reject);
      child.once('close', code => code === 0 && !oversized ? resolve(output.trim()) : reject(new Error('Command failed')));
    });
  } finally { await log.close(); }
}

function bounded(args, cwd, memory = '4G') {
  return run('/usr/bin/systemd-run', ['--user', '--scope', '--quiet', '-p', 'CPUQuota=100%', '-p', `MemoryMax=${memory}`, '-p', 'MemorySwapMax=0', ...args], { cwd });
}

async function healthy(port, expected) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
      const body = await response.json();
      if (response.ok && body.status === 'ok' && body.release === expected) return;
    } catch { /* A fresh process may not yet be listening. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Release health check failed');
}

async function probe(candidate) {
  const unit = `nexusshowcase-probe-${randomUUID()}`;
  let started = false;
  try {
    await run('/usr/bin/systemd-run', [
      '--user', '--collect', `--unit=${unit}`, `--working-directory=${candidate}`,
      '-p', 'CPUQuota=100%', '-p', 'MemoryMax=2G', '-p', 'MemorySwapMax=0',
      '--setenv=NODE_ENV=production', `--setenv=NEXUS_RELEASE_SHA=${sha}`,
      node, path.join(candidate, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3101',
    ]);
    started = true;
    await healthy(3101, sha);
  } finally {
    if (started) await run('/usr/bin/systemctl', ['--user', 'stop', unit]);
  }
}

async function main() {
  assertDeploymentIdentity(sha, runId);
  if (userInfo().username !== 'nexusdeploy') throw new Error('Dedicated deployment user required');
  await mkdir(path.join(root, 'logs'), { recursive: true, mode: 0o700 });
  logFile = path.join(root, 'logs', `${sha}-${runId}-${randomUUID()}.log`);
  await writeFile(logFile, 'RoboticsLab production deployment\n', { flag: 'wx', mode: 0o600 });
  await Promise.all(['home', 'releases', 'storage'].map(name => mkdir(path.join(root, name), { recursive: true, mode: 0o700 })));
  validateDatabaseTargets(await readFile(path.join(root, 'shared/.env'), 'utf8'), await readFile(path.join(root, 'shared/.env.database.local'), 'utf8'));
  const previous = await realpath(path.join(root, 'current'));
  await releasePaths(root, previous);

  stage = 'verify CI';
  await verifyCi(sha, runId);
  const gitDir = path.join(root, 'repository.git');
  stage = 'fetch main';
  await run('/usr/bin/git', ['init', '--bare', gitDir]);
  await run('/usr/bin/git', [`--git-dir=${gitDir}`, 'fetch', '--no-tags', `https://github.com/${repository}.git`, 'refs/heads/main:refs/heads/main']);
  const latest = await run('/usr/bin/git', [`--git-dir=${gitDir}`, 'rev-parse', 'refs/heads/main'], { capture: true });
  if (latest !== sha) throw new Error('Requested commit is no longer latest main');
  if ((await readFile(path.join(previous, '.release-sha'), 'utf8')).trim() === sha) {
    await healthy(3100, sha);
    console.log(`Release ${sha} is already healthy.`);
    return;
  }

  stage = 'prepare release';
  const candidate = await mkdtemp(path.join(root, 'releases', `${sha}-`));
  const archive = path.join(candidate, '.source.tar');
  await run('/usr/bin/git', [`--git-dir=${gitDir}`, 'archive', '--format=tar', `--output=${archive}`, sha]);
  await run('/usr/bin/tar', ['-xf', archive, '-C', candidate]);
  await unlink(archive);
  for (const name of ['.env', '.env.database.local']) await symlink(path.join(root, 'shared', name), path.join(candidate, name));
  await symlink(path.join(root, 'storage'), path.join(candidate, 'storage'));
  await writeFile(path.join(candidate, '.release-sha'), `${sha}\n`, { flag: 'wx', mode: 0o600 });

  stage = 'build';
  await bounded([path.join(tools, 'build.sh'), candidate], candidate);
  await promoteRelease({ root, candidate, sha,
    backup: async () => {
      stage = 'backup';
      const inspect = async () => {
        const text = await run('/usr/bin/systemctl', ['show', 'nexusshowcase-backup.service', '--property=Type,RemainAfterExit,ExecMainStartTimestampMonotonic,Result,ExecMainStatus,ActiveState'], { capture: true });
        return Object.fromEntries(text.split('\n').map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
      };
      const before = await inspect();
      if (before.Type !== 'oneshot' || before.RemainAfterExit !== 'no') throw new Error('Unsafe backup service configuration');
      await run('/usr/bin/sudo', ['-n', '/usr/bin/systemctl', 'start', 'nexusshowcase-backup.service']);
      validateFreshBackup(before, await inspect());
    },
    migrate: async () => {
      stage = 'migrate';
      await bounded([node, path.join(candidate, 'scripts/migrate-database.mjs')], candidate, '2G');
    },
    probe: async () => { stage = 'probe'; await probe(candidate); },
    restart: async () => {
      stage = 'restart';
      await run('/usr/bin/sudo', ['-n', '/usr/bin/systemctl', 'restart', service]);
    },
    health: async () => { stage = 'production health'; await healthy(3100, sha); },
    rollbackHealth: async (previousSha, previousPath) => {
      stage = 'rollback health';
      if (!path.basename(previousPath).startsWith('bootstrap-')) { await healthy(3100, previousSha); return 'verified'; }
      for (let attempt = 0; attempt < 40; attempt++) {
        try {
          const response = await fetch('http://127.0.0.1:3100/login', { cache: 'no-store', signal: AbortSignal.timeout(2000) });
          await response.body?.cancel();
          if (response.ok) return 'bootstrap-http-only';
        } catch { /* Old bootstrap has no exact-SHA health endpoint. */ }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw new Error('Bootstrap did not start serving HTTP');
    },
  });
  console.log(`Deployed main commit ${sha}; database and release health verified.`);
}

main().catch(async error => {
  if (logFile) await appendFile(logFile, `\nFailed during ${stage}: ${error.message}\n`).catch(() => {});
  const recovery = /^(Previous release restored|Rollback restart failed|Rollback health failed|Bootstrap release restarted)/.test(error.message) ? ` ${error.message}` : '';
  console.error(`Deployment failed during ${stage}.${recovery}${logFile ? ` Inspect private server log: ${logFile}` : ''}`);
  process.exitCode = 1;
});
