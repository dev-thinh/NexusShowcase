import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Split-Screen Login Page Layout and Neutral Language', () => {
  it('implements split-screen layout with club mission and escape navigation links', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Header Navbar is preserved
    expect(content).toContain('<Navbar');

    // No AcademicFooter as requested
    expect(content).not.toContain('<AcademicFooter');

    // Standard 2-column container grid alignment
    expect(content).toContain('max-w-7xl');
    expect(content).toContain('grid-cols-1 lg:grid-cols-12');

    // Split-screen structure: aside (club mission) and main
    expect(content).toContain('<aside');
    expect(content).toContain('<main');

    // Consistent light theme (no dark navy block on aside)
    expect(content).not.toContain('bg-[#0F294A]');

    // Club mission and focus areas
    expect(content).toContain('CÂU LẠC BỘ HỌC THUẬT NEXUS');
    expect(content).toContain('Ươm mầm nghiên cứu');

    // Escape hatch navigation buttons on the left bottom
    expect(content).toContain('href="/"');
    expect(content).toContain('href="/contact"');
    expect(content).toContain('Trang chủ');
    expect(content).toContain('Liên hệ');
  });

  it('ensures login form uses neutral language, larger max-w-lg styling, and clean inputs', () => {
    const formPath = path.resolve(process.cwd(), 'src/app/login/login-form.tsx');
    const content = fs.readFileSync(formPath, 'utf-8');

    // Neutral titles and labels
    expect(content).toContain('Đăng nhập');
    expect(content).not.toContain('Nhập thông tin tài khoản để tiếp tục');
    expect(content).toContain('Tài khoản hoặc Email');
    expect(content).toContain('Mật khẩu');

    // No jargon or club-exclusive wording
    expect(content).not.toContain('Xác Thực Thành Viên');
    expect(content).not.toContain('Cổng quản trị &amp; công bố nghiên cứu');

    // Larger dimensions and rounded-lg
    expect(content).toContain('max-w-lg');
    expect(content).toContain('rounded-lg');
  });
});
