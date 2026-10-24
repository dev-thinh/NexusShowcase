import { loadEnvConfig } from '@next/env';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { createBenchmarkFixtures } from '../tests/fixtures/benchmark';
import { createTestFixtures } from '../tests/fixtures/database';
import { writeFixtureImages, removeFixtureImages } from '../tests/fixtures/moments';
import { runNavigationBenchmark } from './benchmark-navigation';

loadEnvConfig(process.cwd());
const harnessRoot = path.resolve('.harness');
const directory = path.join(harnessRoot, randomUUID());
mkdirSync(directory, { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.resolve('.playwright');
const next = path.resolve('node_modules/next/dist/bin/next');
const secrets = new Set(Object.entries(process.env).filter(([key, value]) => !!value && /DATABASE_URL|AUTH_SECRET|PASSWORD|TOKEN/.test(key)).map(([, value]) => value!));
function redact(line: string) {
  for (const value of secrets) line = line.split(value).join('[redacted]');
  return line.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted database URL]').replace(/fill\("[^"]*"\)/g, 'fill("[redacted]")');
}

function child(script: string, args: string[], env: NodeJS.ProcessEnv, onLine?: (line: string) => void) {
  const processChild = spawn(process.execPath, [script, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  for (const stream of [processChild.stdout, processChild.stderr]) {
    let buffer = '';
    stream?.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/); buffer = lines.pop()!;
      for (const line of lines) {
        if (onLine) onLine(line);
        // Runtime errors can contain connection strings or session payloads.
        else console.log(redact(line));
      }
    });
  }
  return processChild;
}
async function completion(processChild: ChildProcess): Promise<number> {
  if (processChild.exitCode !== null || processChild.signalCode !== null) return processChild.exitCode ?? 1;
  return new Promise((resolve, reject) => { processChild.once('error', reject); processChild.once('exit', code => resolve(code ?? 1)); });
}
async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No harness port available.');
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}
async function stop(server: ChildProcess) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  const exited = completion(server);
  server.kill();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([exited, new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(Error('Isolated production server shutdown timed out.')), 10_000); })]);
  } finally { if (timeout) clearTimeout(timeout); }
}

async function main() {
  await writeFixtureImages();
  const benchmark = process.argv[2] === 'benchmark';
  let result = 0;
  for (const items of (benchmark ? [20, 1000] : [20]) as Array<20 | 1000>) {
    const fixture = await createTestFixtures();
    let server: ChildProcess | undefined;
    try {
      const staged = await createBenchmarkFixtures({ ...fixture, items, members: 100 });
      for (const user of staged.users) { secrets.add(user.email); secrets.add(user.password); }
      const databaseUrl = new URL(process.env.TEST_DATABASE_URL!);
      databaseUrl.searchParams.set('schema', fixture.prefix);
      secrets.add(databaseUrl.toString());
      const port = await freePort();
      const baseUrl = `http://127.0.0.1:${port}`;
      const manifest = path.join(directory, `fixture-${items}.json`);
      const events = path.join(directory, `events-${items}.jsonl`);
      writeFileSync(manifest, JSON.stringify(staged), { mode: 0o600 });
      writeFileSync(events, '');
      const env = { ...process.env, ASSET_STORAGE: 'local', NEXUS_TEST_BUILD: '1', DATABASE_URL: databaseUrl.toString(), NEXTAUTH_URL: baseUrl, AUTH_URL: baseUrl, PERF_METRICS: '1', HARNESS_MANIFEST: manifest, HARNESS_BASE_URL: baseUrl, HARNESS_EVENTS: events, HARNESS_ITEMS: String(items) };
      console.log(`Building isolated production harness: ${items} items / 100 members`);
      const buildCode = await completion(child(next, ['build', '--webpack'], { ...env, PERF_METRICS: '0' }));
      if (buildCode) throw Error(`Production build exited ${buildCode}.`);
      server = child(next, ['start', '--hostname', '127.0.0.1', '--port', String(port)], env, line => {
        const match = line.match(/^\[perf\] (\{.*\})$/);
        if (!match) return;
        try {
          const value = JSON.parse(match[1]);
          if (['auth', 'query'].includes(value.name) && Number.isFinite(value.durationMs) && Number.isFinite(value.timestamp)) {
            appendFileSync(events, `${JSON.stringify({ name: value.name, durationMs: value.durationMs, timestamp: value.timestamp })}\n`);
          }
        } catch { /* Only the numeric timing protocol is retained. */ }
      });
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (server.exitCode !== null) throw Error('Isolated production server exited before readiness.');
        try { ready = (await fetch(`${baseUrl}/api/auth/providers`)).ok; } catch { /* startup */ }
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (!ready) throw Error('Isolated production server readiness timed out.');
      if (benchmark) {
        process.env.HARNESS_EVENTS = events;
        process.env.HARNESS_ITEMS = String(items);
        await runNavigationBenchmark({ baseUrl, warmRuns: 10, outputPath: process.env.HARNESS_BENCHMARK_OUTPUT ?? 'docs/superpowers/reports/navigation-viewport/metrics.json' });
      } else result = await completion(child(path.resolve('node_modules/@playwright/test/cli.js'), ['test', ...process.argv.slice(3)], env));
    } finally {
      try { if (server) await stop(server); } finally { await fixture.cleanup(); }
    }
  }
  return result;
}

main().then(code => { process.exitCode = code; }).catch(error => {
  // Do not surface Prisma errors: they can contain connection credentials.
  console.error(/^(Production build|Isolated production|Dedicated|TEST_DATABASE_URL|Benchmark fixtures)/.test(error.message) ? error.message : 'Browser harness failed; inspect the sanitized build/test output.');
  if (/^(page\.|browserType\.|browserContext\.)/.test(error.message)) console.error(redact(error.message.slice(0, 500)));
  process.exitCode = 1;
}).finally(async () => {
  await removeFixtureImages();
  const resolved = path.resolve(directory);
  const relative = path.relative(harnessRoot, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || path.dirname(resolved) !== harnessRoot || !/^[a-f0-9-]{36}$/.test(path.basename(resolved))) throw Error('Refusing cleanup outside the owned harness directory.');
  rmSync(resolved, { recursive: true, force: true });
});
