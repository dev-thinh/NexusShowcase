import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('member submission routes', () => {
  it.each([
    'src/app/dashboard/items/new/page.tsx',
    'src/app/dashboard/items/[id]/edit/page.tsx',
  ])('%s uses the shared submission editor and document width', (file) => {
    const source = read(file);
    expect(source).toContain('SubmissionEditor');
    expect(source).toContain('max-w-7xl');
    expect(source).not.toContain('ItemForm');
    expect(source).not.toContain('prisma.category.findMany');
  });

  it('adapts existing draft records through one mapper', () => {
    expect(read('src/app/dashboard/items/[id]/edit/page.tsx')).toContain('mapShowcaseItemToSubmission');
    expect(read('src/lib/submission-types.ts')).toContain('export function mapShowcaseItemToSubmission');
  });
});
