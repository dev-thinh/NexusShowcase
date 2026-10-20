import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Showcase Detail Page Visibility Protection', () => {
  it('protects private items from unauthenticated guests and contains toggle button', () => {
    const detailPath = path.resolve(process.cwd(), 'src/app/showcase/[slug]/page.tsx');
    const content = fs.readFileSync(detailPath, 'utf-8');

    expect(content).toContain('visibility');
    expect(content).toContain('CardAdminControls');
    expect(content).toContain("redirect(`/login?callbackUrl=/showcase/${slug}`)");
    expect(content).not.toContain("item.visibility === 'PUBLIC' ? 'Công khai' : 'Nội bộ'");
  });

  it('VisibilityToggleButton component exists', () => {
    const togglePath = path.resolve(process.cwd(), 'src/components/visibility-toggle-button.tsx');
    expect(fs.existsSync(togglePath)).toBe(true);
  });

  it('uses a continuous article layout with a resource sidebar', () => {
    const detailPath = path.resolve(process.cwd(), 'src/app/showcase/[slug]/page.tsx');
    const content = fs.readFileSync(detailPath, 'utf-8');

    expect(content).not.toContain('panel-detail');
    expect(content).not.toContain('panel-nested');
    expect(content).toContain('lg:sticky');
    expect(content).toContain('lg:grid-cols-[minmax(0,1fr)_18rem]');
    expect(content).not.toContain('rounded-2xl border border-slate-200 bg-white shadow-sm');
    expect(content).toContain('id="abstract"');
    expect(content).not.toContain('aria-label="Mục lục công trình"');
    expect(content).toContain('aria-labelledby="resources-title"');
    expect(content).toContain('object-contain');
    expect(content).toContain('ResourceLinks resources={sidebarResources}');
    expect(content).toContain('action-secondary-detail');
  });
});
