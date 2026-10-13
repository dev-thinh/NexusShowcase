import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Category Directory Page Multi-Layout', () => {
  it('exists and handles the 4 layout types', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/category/[slug]/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('BIBLIOGRAPHY');
    expect(content).toContain('SHOWCASE_GRID');
    expect(content).toContain('DATA_CATALOG');
    expect(content).toContain('HONOR_ROLL');
  });
});
