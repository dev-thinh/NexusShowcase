import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { assertTestDatabaseUrl } from './tests/setup/database-guard';

// Load only inside this explicitly selected config. Never print connection values.
const env = loadEnv('test', process.cwd(), '');
for (const key of ['DATABASE_URL', 'TEST_DATABASE_URL', 'AUTH_SECRET', 'NEXTAUTH_SECRET']) {
  if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
}
assertTestDatabaseUrl(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL, {});

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    env: { ASSET_STORAGE: 'local' },
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.test.{ts,tsx}'],
    fileParallelism: false,
    sequence: { hooks: 'stack' },
    setupFiles: ['./tests/setup/database.ts'],
    hookTimeout: 30_000,
  },
  resolve: { alias: { '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src') } },
});
