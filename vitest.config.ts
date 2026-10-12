import { defineConfig } from 'vitest/config';
import path from 'path';

const isUnitOnly = process.argv.some((arg) => {
  const norm = arg.replace(/\\/g, '/').toLowerCase();
  return norm.includes('tests/unit') || norm.includes('unit');
});

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
