import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it('keeps test production output separate from the running development server', async () => {
  vi.stubEnv('NEXUS_TEST_BUILD', '1');
  vi.resetModules();
  expect((await import('../../next.config')).default.distDir).toBe('.next-harness');
});
it('keeps the normal application build directory unchanged', async () => {
  vi.stubEnv('NEXUS_TEST_BUILD', '');
  vi.resetModules();
  expect((await import('../../next.config')).default.distDir).toBe('.next');
});
it('keeps the precompiled preview separate from development and test builds', async () => {
  vi.stubEnv('NEXUS_TEST_BUILD', '');
  vi.stubEnv('NEXUS_PREVIEW_BUILD', '1');
  expect((await import('../../next.config')).default.distDir).toBe('.next-preview');
});
it('keeps test isolation when both build flags are present', async () => {
  vi.stubEnv('NEXUS_TEST_BUILD', '1');
  vi.stubEnv('NEXUS_PREVIEW_BUILD', '1');
  expect((await import('../../next.config')).default.distDir).toBe('.next-harness');
});
