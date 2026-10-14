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

    // The content area fills the viewport below the 64px navbar, while the
    // left introduction starts flush with the top edge of the login form.
    expect(content).toContain('max-w-7xl');
    expect(content).toContain('min-h-[calc(100dvh-4rem)]');
    expect(content).toContain('grid-cols-1 lg:grid-cols-12');
    expect(content).toContain('grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start');

    // Split-screen structure: aside (club mission) and main
    expect(content).toContain('<aside');
    expect(content).toContain('<main');

    // Consistent light theme: the aside stays light even when small controls use navy
    expect(content).not.toMatch(/<aside[^>]*bg-\[#0F294A\]/);

    // System name and lab focus
    expect(content).toContain('Robotics & IoT Lab');
    expect(content).toContain('Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM');
    expect(content).toContain('Ươm mầm nghiên cứu');
    expect(content).not.toContain('Khoa CNTT · ĐH Khoa học Tự nhiên');

    // Escape hatch navigation buttons on the left bottom
    expect(content).toContain('href="/"');
    expect(content).toContain('href="/contact"');
    expect(content).toContain('Trang chủ');
    expect(content).toContain('Liên hệ');
  });

  it('uses a borderless static brand lockup and keeps navy for the home button', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('data-brand-lockup="login"');
    expect(content).toContain('bg-slate-100/80');
    expect(content).not.toContain('bg-emerald-400 animate-pulse');
    expect(content).not.toContain('rounded-md bg-[#0F294A] text-white text-xs');
    expect(content).toContain('hover:bg-[#1E3A5F]');
    expect(content).toContain('bg-white hover:bg-slate-50 text-slate-800');
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

  it('keeps the login icon inline with its title instead of hanging in the page gutter', () => {
    const formPath = path.resolve(process.cwd(), 'src/app/login/login-form.tsx');
    const content = fs.readFileSync(formPath, 'utf-8');

    expect(content).toContain('flex items-center gap-3 pb-4');
    expect(content).not.toContain('heading-gutter-icon');
  });
});
