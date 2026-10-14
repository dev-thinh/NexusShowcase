import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('operational panel consistency', () => {
  it.each([
    'src/app/dashboard/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/reviews/page.tsx',
    'src/components/admin-member-table.tsx',
  ])('uses operational panels in %s', (file) => {
    expect(read(file)).toContain('panel-operational');
  });

  it.each(['src/app/dashboard/loading.tsx', 'src/app/admin/loading.tsx'])(
    'matches operational geometry in %s',
    (file) => {
      expect(read(file)).toContain('panel-operational');
    },
  );
});
