import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Home Page Minimalist Revamp', () => {
  it('has removed FeaturedFilmstrip and 3 counter boxes', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/(shell)/(site)/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).not.toContain('<FeaturedFilmstrip');
    expect(content).not.toContain('totalPapers');
    expect(content).not.toContain('totalProjects');
    expect(content).not.toContain('totalAchievements');
  });

  it('keeps the research category aware of visitor permissions', () => {
    const pagePath = path.resolve(process.cwd(), 'src/features/publications/components/category-page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('visibility');
    expect(content).toContain('auth');
  });

  it('keeps home sections aligned and allows the research background to span the page', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/(shell)/(site)/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('<main className="w-full');
    expect(content).toContain('container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8');
    expect(content).toContain('className="research-band"');
  });

  it('matches brand panel design and implements Academic Lab Portal structure', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/(shell)/(site)/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('<HomeHero />');
    expect(content).toContain('href="/research"');
    expect(content).toContain('Xem nghiên cứu khoa học');
    expect(content).not.toContain('id="home-search"');
    expect(content).not.toContain('Kết quả tìm kiếm');

    // The homepage combines work into one list alongside research directions.
    expect(content).toContain('<HomeResearchSection />');
    expect(fs.readFileSync(path.resolve(process.cwd(), 'src/app/(shell)/(site)/research-section-heading.tsx'), 'utf-8')).toContain('Hướng nghiên cứu');
    expect(content).toContain('Công trình nổi bật');
    expect(content).toContain('Thành viên');
    expect(content).toContain('href="/members"');
    expect(content).not.toContain('creativeProjects');
    expect(content).not.toContain('roboticsProjects');
    expect(content).toContain('<HomeFeaturedSection />');

  });
});

