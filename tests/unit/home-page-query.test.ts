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

  it('matches login page brand panel design and includes 4 core pillar filter tabs', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Brand panel matching login page structure & styling
    expect(content).toContain('rounded-lg bg-white border border-slate-200 shadow-2xs mb-4');
    expect(content).toContain('rounded-md bg-slate-900 text-white text-xs font-bold tracking-wide shadow-2xs');
    expect(content).toContain('bg-emerald-400 animate-pulse');
    expect(content).toContain('Robotics &amp; IoT Lab');
    expect(content).toContain('Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM');

    // Title and Subtitle
    expect(content).toContain('Nghiên Cứu Khoa Học &amp; Công Nghệ Robotics · IoT');
    expect(content).toContain('CLB Robotics &amp; IoT HCMUS');

    // 4 Pillar filter tabs
    expect(content).toContain('Tất cả công trình');
    expect(content).toContain('Robotics & IoT');
    expect(content).toContain('Nghiên cứu khoa học');
    expect(content).toContain('Dự án & Sáng tạo');
  });
});

