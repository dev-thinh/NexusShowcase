import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Login Page Single-Screen and Neutral Language', () => {
  it('ensures login page is contained in single screen without scrolling', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Single screen constraints
    expect(content).toContain('h-screen');
    expect(content).toContain('overflow-hidden');

    // Eliminates massive redundant hero banner
    expect(content).not.toContain('Cổng Đăng Nhập &amp; Xác Thực Thành Viên');
    expect(content).not.toContain('hồ sơ năng lực học thuật sinh viên CLB Nexus');
  });

  it('ensures login form uses neutral language and compact styling', () => {
    const formPath = path.resolve(process.cwd(), 'src/app/login/login-form.tsx');
    const content = fs.readFileSync(formPath, 'utf-8');

    // Neutral titles and labels
    expect(content).toContain('Đăng nhập');
    expect(content).toContain('Nhập thông tin tài khoản để tiếp tục');
    expect(content).toContain('Tài khoản hoặc Email');
    expect(content).toContain('Mật khẩu');

    // No jargon or club-exclusive wording
    expect(content).not.toContain('Xác Thực Thành Viên');
    expect(content).not.toContain('Cổng quản trị &amp; công bố nghiên cứu');

    // Proper rounded-lg and naked title icon
    expect(content).toContain('rounded-lg');
  });
});
