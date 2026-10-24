import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('operational panel consistency', () => {
  it.each([
    'src/features/submissions/components/my-posts.tsx',
    'src/app/(shell)/(account)/admin/page.tsx',
    'src/app/(shell)/(account)/admin/reviews/page.tsx',
    'src/features/identity/components/admin-member-table.tsx',
  ])('uses operational panels in %s', (file) => {
    expect(read(file)).toContain('panel-operational');
  });

  it.each(['src/app/dashboard/loading.tsx', 'src/app/admin/loading.tsx'])(
    'keeps the current page until the management destination is ready: %s',
    (file) => {
      expect(fs.existsSync(path.resolve(process.cwd(), file))).toBe(false);
    },
  );
});
