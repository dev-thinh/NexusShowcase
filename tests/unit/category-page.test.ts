import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Category Directory Page', () => {
  it('shows research thumbnails without cropping diagrams and keeps cards compact', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/app/category/[slug]/page.tsx'), 'utf-8');
    expect(content).toContain('object-contain');
    expect(content).toContain('loading="lazy"');
    expect(content).toContain('sm:py-5');
    expect(content).toContain('panel-public');
  });
});
