import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Members Directory Page', () => {
  it('exists and organizes members by roles', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/members/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('ADMIN');
    expect(content).toContain('CORE_MEMBER');
    expect(content).toContain('MEMBER');
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
});
