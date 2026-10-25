import { afterEach, expect, it, vi } from 'vitest';
import ts from 'typescript';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it('checks source files without build-generated types or the rewritten next-env entrypoint', () => {
  const config = ts.readConfigFile('tsconfig.check.json', ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  expect(parsed.errors).toEqual([]);
  expect(parsed.fileNames.some(file => file.replaceAll('\\', '/').includes('/src/'))).toBe(true);
  expect(parsed.fileNames.some(file => /(?:^|[\\/])\.next(?:-preview|-harness)?[\\/]|(?:^|[\\/])next-env\.d\.ts$/.test(file))).toBe(false);
});
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
