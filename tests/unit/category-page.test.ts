import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Category Directory Page', () => {
  it('shows research thumbnails without cropping diagrams and keeps cards compact', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/app/(shell)/(site)/category/[slug]/page.tsx'), 'utf-8');
    expect(content).toContain('object-contain');
    expect(content).toContain('loading="lazy"');
    expect(content).toContain('sm:p-6');
    expect(content).toContain('panel-public');
  });
});
