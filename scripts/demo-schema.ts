import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { validateDemoEnvironment } from './demo-environment';

export function demoMigrationEnvironment(demo: NodeJS.ProcessEnv, maintenanceUrl: string): NodeJS.ProcessEnv {
  validateDemoEnvironment(demo);
  let target: URL;
  try {
    target = new URL(maintenanceUrl);
    const runtime = new URL(demo.DATABASE_URL!);
    if (!['postgresql:', 'postgres:'].includes(target.protocol) || target.hostname !== runtime.hostname || target.port !== runtime.port || target.searchParams.has('host') || target.hash) throw new Error();
    target.pathname = '/nexus_showcase_demo';
    target.searchParams.set('schema', 'public');
  } catch {
    throw new Error('Demo migrations require maintenance credentials for the same local database service.');
  }
  return { ...demo, DATABASE_URL: target.href };
}

type Runner = (args: string[], env: NodeJS.ProcessEnv) => Promise<number>;
const run: Runner = (args, env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['node_modules/prisma/build/index.js', ...args], { env, stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', code => resolve(code ?? 1));
});

export async function syncDemoSchema(demo: NodeJS.ProcessEnv, maintenanceUrl?: string, runner: Runner = run) {
  const maintenance = maintenanceUrl ?? process.env.MIGRATION_DATABASE_URL ?? parseEnv(readFileSync('.env.database.local', 'utf8')).MIGRATION_DATABASE_URL;
  const env = demoMigrationEnvironment(demo, maintenance ?? '');
  if (await runner(['generate'], demo)) throw new Error('Could not generate Prisma Client; demo was not started.');
  if (await runner(['migrate', 'deploy'], env)) throw new Error('Demo database migrations failed; demo was not started.');
}
