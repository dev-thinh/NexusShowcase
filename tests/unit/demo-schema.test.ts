import { expect, it, vi } from 'vitest';
import { demoMigrationEnvironment, syncDemoSchema } from '../../scripts/demo-schema';
const demo: NodeJS.ProcessEnv = { DATABASE_URL: 'postgresql://nexus_demo_runtime:private@127.0.0.1:5434/nexus_showcase_demo?schema=public', ALLOW_DEMO_SEED: 'true', NODE_ENV: 'development', ASSET_STORAGE: 'local', NEXUS_DEMO_BUILD: '1', AUTH_URL: 'http://127.0.0.1:3002', NEXTAUTH_URL: 'http://127.0.0.1:3002', AUTH_SECRET: 'test-only-not-an-actual-secret-0123456789' };
const maintenance = 'postgresql://admin:private@127.0.0.1:5434/nexus_showcase?schema=public';
it('targets only the demo database with maintenance credentials and leaves runtime config unchanged', () => {
  const env = demoMigrationEnvironment(demo, maintenance);
  const url = new URL(env.DATABASE_URL!);
  expect(url.pathname).toBe('/nexus_showcase_demo');
  expect(url.username).toBe('admin');
  expect(demo.DATABASE_URL).toContain('nexus_demo_runtime');
});
it.each(['postgresql://admin:secret@remote.test:5434/main', 'postgresql://admin:secret@127.0.0.1:5433/main', 'postgresql://admin:secret@127.0.0.1:5434/main?host=evil.test', 'invalid'])('rejects incompatible migration targets without exposing credentials', url => {
  expect(() => demoMigrationEnvironment(demo, url)).toThrow('same local database service');
});
it('generates the client and migrates the demo before allowing startup', async () => {
  const runner = vi.fn().mockResolvedValue(0);
  await syncDemoSchema(demo, maintenance, runner);
  expect(runner.mock.calls.map(call => call[0])).toEqual([['generate'], ['migrate', 'deploy']]);
  expect(new URL(runner.mock.calls[1][1].DATABASE_URL).pathname).toBe('/nexus_showcase_demo');
});
it('stops startup if generation or migration fails', async () => {
  const runner = vi.fn().mockResolvedValue(1);
  await expect(syncDemoSchema(demo, maintenance, runner)).rejects.toThrow('generate');
  expect(runner).toHaveBeenCalledTimes(1);
  runner.mockReset().mockResolvedValueOnce(0).mockResolvedValueOnce(1);
  await expect(syncDemoSchema(demo, maintenance, runner)).rejects.toThrow('migrations failed');
});
