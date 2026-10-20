import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('citation action spacing', () => {
  it.each(['src/app/page.tsx', 'src/app/category/[slug]/page.tsx'])(
    'uses separated card action rows in %s',
    (file) => {
      const content = read(file);
      expect(content).toContain('action-row-card');
      expect(content).toContain('action-primary-card');
    },
  );

  it('uses an accessible eight-pixel icon gap for citation triggers', () => {
    const content = read('src/components/citation-modal.tsx');
    expect(content).toContain('aria-hidden="true"');
    expect(content).toContain('gap-2');
  });
});
