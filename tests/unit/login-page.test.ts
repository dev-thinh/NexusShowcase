import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Login Page Structure and Neutral Language', () => {
  it('ensures login page includes AcademicFooter and eliminates redundant hero banner', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Restored AcademicFooter
    expect(content).toContain('AcademicFooter');

    // Eliminates massive redundant hero banner
    expect(content).not.toContain('Cổng Đăng Nhập &amp; Xác Thực Thành Viên');
    expect(content).not.toContain('hồ sơ năng lực học thuật sinh viên CLB Nexus');
  });

  it('ensures login form uses neutral language, larger max-w-lg styling, and no redundant subtitle', () => {
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
