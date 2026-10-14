import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Navbar Nav Component Structure', () => {
  it('implements the exact requested order and naming', () => {
    const navbarNavPath = path.resolve(process.cwd(), 'src/components/navbar-nav.tsx');
    const content = fs.readFileSync(navbarNavPath, 'utf-8');

    // Tab renamed to 'Bài đăng' (2 words), only shown when authenticated
    expect(content).toContain('Bài đăng');
    expect(content).not.toContain('<span>Dashboard</span>');
    expect(content).toContain('{user && (');
    expect(content).toContain('href="/dashboard"');
    expect(content).toContain('bg-[#0F294A]');

    // Contains links to members and contact
    expect(content).toContain('href="/members"');
    expect(content).toContain('href="/contact"');
    expect(content).toContain('Thành viên');
    expect(content).toContain('Liên hệ');

    // Layout assigns tabs and account actions to explicit columns in the
    // navbar's balanced three-column grid.
    expect(content).toContain('col-start-2 row-start-1 justify-self-center');
    expect(content).toContain('col-start-3 row-start-1 justify-self-end');
    expect(content).not.toContain('absolute left-1/2 -translate-x-1/2');
    expect(content).toContain('right-0');
    expect(content).not.toContain('fixed bottom-5 right-5');
    expect(content).not.toContain('aria-label="Lối tắt Quản trị"');
  });

  it('streamlines center navigation to core tabs while passing featured categories', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    expect(content).toContain('getFeaturedNavCategories');
    expect(content).toContain('featuredCategories');
    expect(content).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');

    const navbarNavPath = path.resolve(process.cwd(), 'src/components/navbar-nav.tsx');
    const navContent = fs.readFileSync(navbarNavPath, 'utf-8');
    expect(navContent).not.toContain('{featuredCategories.map');
  });
});
