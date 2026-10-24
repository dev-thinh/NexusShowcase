import { defineConfig } from '@playwright/test';

if (!process.env.HARNESS_MANIFEST || !process.env.HARNESS_BASE_URL) throw Error('Run npm run test:e2e to provision the isolated production harness.');
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, retries: 0,
  timeout: 30_000, expect: { timeout: 8_000 },
  reporter: [['list']], outputDir: 'test-results',
  use: { baseURL: process.env.HARNESS_BASE_URL, browserName: 'chromium', channel: process.env.HARNESS_BROWSER_CHANNEL ?? 'chromium', viewport: { width: 1440, height: 1000 }, trace: 'off', screenshot: 'off', video: 'off' },
});
