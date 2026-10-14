import { describe, expect, it } from 'vitest';
import { buildHomepageCategoryWhere } from '@/lib/home-section-filters';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('homepage category filters', () => {
  it('selects the exact category while preserving the public item boundary', () => {
    expect(
      buildHomepageCategoryWhere('robotics-iot', {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      }),
    ).toEqual({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      category: { slug: 'robotics-iot' },
    });
  });

  it('does not add a visibility restriction for authenticated visitors', () => {
    expect(
      buildHomepageCategoryWhere('du-an-sang-tao', {
        status: 'PUBLISHED',
      }),
    ).toEqual({
      status: 'PUBLISHED',
      category: { slug: 'du-an-sang-tao' },
    });
  });

  it('keeps all three homepage section CTAs visually and verbally consistent', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(page.match(/<span>Xem tất cả \(\{/g) ?? []).toHaveLength(3);
    expect(page).not.toContain('Xem tất cả bài báo');
    expect(page).not.toContain('Xem tất cả dự án');
    expect(page.match(/data-home-view-all\s+className="action-primary-card/g) ?? []).toHaveLength(3);
  });
});
