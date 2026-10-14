import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Members Directory Page', () => {
  it('exists and organizes members by roles', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/members/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('ADMIN');
    expect(content).toContain('CORE_MEMBER');
    expect(content).toContain('MEMBER');
  });

  it('keeps member detail and its loading state geometrically aligned', () => {
    const detail = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/members/[id]/page.tsx'),
      'utf-8',
    );
    const loading = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/members/[id]/loading.tsx'),
      'utf-8',
    );

    expect(detail).toContain('panel-detail');
    expect(detail).toContain('panel-nested');
    expect(loading).toContain('panel-detail');
    expect(loading).toContain('panel-nested');
  });
});
