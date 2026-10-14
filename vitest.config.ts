import { defineConfig } from 'vitest/config';
import path from 'path';

const isUnitRequested = process.argv.some((arg) => {
  const norm = arg.replace(/\\/g, '/').toLowerCase();
  return norm.includes('tests/unit') || norm.includes('unit');
});
const isDatabaseSuiteRequested = process.argv.some((arg) => {
  const norm = arg.replace(/\\/g, '/').toLowerCase();
  return norm.includes('tests/integration') || norm.includes('tests/e2e');
});
const isUnitOnly = isUnitRequested && !isDatabaseSuiteRequested;

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: isUnitOnly ? [] : ['./tests/setup/database.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
