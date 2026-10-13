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

    // Layout keeps center navigation dead-center and admin menu right-anchored
    expect(content).toContain('absolute left-1/2 -translate-x-1/2');
    expect(content).toContain('right-0');
  });

  it('receives and renders featured categories in navbar', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    expect(content).toContain('getFeaturedNavCategories');
    expect(content).toContain('featuredCategories');
  });
});
