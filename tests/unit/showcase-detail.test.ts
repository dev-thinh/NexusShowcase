import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Showcase Detail Page Visibility Protection', () => {
  it('protects private items from unauthenticated guests and contains toggle button', () => {
    const detailPath = path.resolve(process.cwd(), 'src/app/showcase/[slug]/page.tsx');
    const content = fs.readFileSync(detailPath, 'utf-8');

    expect(content).toContain('visibility');
    expect(content).toContain('VisibilityToggleButton');
    expect(content).toContain("redirect(`/login?callbackUrl=/showcase/${slug}`)");
    expect(content).toContain("item.visibility === 'PUBLIC' ? '🌐 Công khai' : '🔒 Nội bộ'");
  });

  it('VisibilityToggleButton component exists', () => {
    const togglePath = path.resolve(process.cwd(), 'src/components/visibility-toggle-button.tsx');
    expect(fs.existsSync(togglePath)).toBe(true);
  });
});
