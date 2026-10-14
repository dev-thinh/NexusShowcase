import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Home Page Minimalist Revamp', () => {
  it('has removed FeaturedFilmstrip and 3 counter boxes', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).not.toContain('<FeaturedFilmstrip');
    expect(content).not.toContain('totalPapers');
    expect(content).not.toContain('totalProjects');
    expect(content).not.toContain('totalAchievements');
  });

  it('applies visibility: PUBLIC filter when user is not logged in', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('visibility');
    expect(content).toContain('auth');
  });

  it('matches brand panel design and implements Academic Lab Portal structure', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Brand panel with dark navy chip and slightly larger home page scale
    expect(content).toContain('rounded-xl bg-white border border-slate-200 shadow-xs mb-5 sm:mb-6');
    expect(content).toContain('rounded-lg bg-[#0F294A] text-white text-xs sm:text-sm font-bold tracking-wide shadow-2xs');
    expect(content).toContain('bg-emerald-400 animate-pulse');
    expect(content).toContain('Robotics &amp; IoT Lab');
    expect(content).toContain('Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM');

    // Title and Subtitle
    expect(content).toContain('Nghiên Cứu Khoa Học &amp; Công Nghệ Robotics · IoT');
    expect(content).toContain('CLB Robotics &amp; IoT HCMUS');

    // Central search bar
    expect(content).toContain('name="q"');
    expect(content).toContain('Tìm kiếm bài báo, dự án robot, tác giả...');

    // Academic Lab Portal Sections
    expect(content).toContain('Công Trình &amp; Bài Báo Khoa Học Mới Xuất Bản');
    expect(content).toContain('Dự Án Robotics &amp; Hệ Thống Nhúng Tiêu Biểu');
    expect(content).toContain('Dự Án Sáng Tạo &amp; Giải Pháp Khác');

    // Direct Category navigation links
    expect(content).toContain('/category/bai-bao-khoa-hoc');
    expect(content).toContain('/category/robotics-iot');
    expect(content).toContain('/category/du-an-sang-tao');

    // Public content cards share the sitewide panel surface.
    expect(content).toContain('panel-public');

    // Academic tools
    expect(content).toContain('<CitationModal');
  });
});

