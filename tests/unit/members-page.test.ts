import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Members Directory Page', () => {
  it('renders the approved header, hierarchy, and six-member preview', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/members/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('Thành viên Robotics &amp; IoT Lab');
    expect(content).toContain('{members.length} thành viên');
    expect(content).not.toContain('Nhân sự &amp; Nghiên cứu viên');
    expect(content).not.toContain('Mạng lưới sinh viên');
    expect(content).not.toContain('Danh bạ');
    expect(content).not.toContain('heading-gutter-icon');
    expect(content).toContain('max-w-7xl');
    expect(content).toContain('MEMBER_GROUP_LABELS.ADMIN');
    expect(content).toContain('MEMBER_GROUP_LABELS.CORE_MEMBER');
    expect(content).toContain('MEMBER_GROUP_LABELS.MEMBER');
    expect(content).toContain(
      'paginateMembers(regularMembers, params.page, 6)',
    );
    expect(content).toContain('href="/members/all"');
  });

  it('keeps member detail and its loading state geometrically aligned', () => {
    const detail = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/members/[id]/page.tsx'),
      'utf-8',
    );
    const loading = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/members/[id]/loading.tsx'),
      'utf-8',
    );

    expect(detail).toContain('panel-detail');
    expect(detail).toContain('panel-nested');
    expect(loading).toContain('panel-detail');
    expect(loading).toContain('panel-nested');
  });

  it('uses shared accessible cards and server-link pagination', () => {
    const card = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/member-card.tsx'),
      'utf-8',
    );
    const pagination = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/member-pagination.tsx'),
      'utf-8',
    );

    expect(card).toContain('aria-label={`GitHub của ${member.fullName}`}');
    expect(card).toContain('aria-label={`LinkedIn của ${member.fullName}`}');
    expect(card).toContain('h-full');
    expect(card).toContain('mt-auto');
    expect(card).toContain('công trình');
    expect(pagination).toContain(
      "aria-current={pageNumber === page ? 'page' : undefined}",
    );
    expect(pagination).toContain('Trang trước');
    expect(pagination).toContain('Trang sau');
  });

  it('provides a MEMBER-only full directory with twelve records per page', () => {
    const fullPagePath = path.resolve(
      process.cwd(),
      'src/app/members/all/page.tsx',
    );
    expect(fs.existsSync(fullPagePath)).toBe(true);

    const content = fs.readFileSync(fullPagePath, 'utf-8');
    expect(content).toContain("role: 'MEMBER'");
    expect(content).toContain("status: 'ACTIVE'");
    expect(content).toContain(
      'paginateMembers(members, params.page, 12)',
    );
    expect(content).toContain('Tất cả thành viên');
    expect(content).not.toContain("role: 'ADMIN'");
    expect(content).not.toContain("role: 'CORE_MEMBER'");
  });
});
