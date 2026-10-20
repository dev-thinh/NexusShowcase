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

  it('aligns both home content states with the footer container', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content.match(/<main className="container mx-auto px-4 sm:px-6 lg:px-8[^\"]*max-w-7xl/g)).toHaveLength(2);
    expect(content).not.toContain('py-8 sm:py-10 max-w-5xl flex-1');
    expect(content).not.toContain('py-10 sm:py-14 max-w-6xl flex-1');
  });

  it('matches brand panel design and implements Academic Lab Portal structure', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('<HomeHero />');
    expect(content).toContain('Thư viện công trình');
    expect(content).toContain('Kết quả tìm kiếm');
    expect(content).toContain('role="search"');
    expect(content).toContain('variant="outline"');

    // Central search bar
    expect(content).toContain('name="q"');
    expect(content).toContain('Tìm kiếm bài báo, dự án robot, tác giả...');

    // The homepage combines work into one list alongside research directions.
    expect(content).toContain('Hướng nghiên cứu');
    expect(content).toContain('Công trình nổi bật');
    expect(content).toContain('Thành viên');
    expect(content).toContain('href="/members"');
    expect(content).not.toContain('creativeProjects');
    expect(content).not.toContain('roboticsProjects');
    expect(content).toContain('take: 3');

    // Public content cards share the sitewide panel surface.
    expect(content).toContain('panel-public');

    // Academic tools
    expect(content).toContain('<CitationModal');
  });
});

