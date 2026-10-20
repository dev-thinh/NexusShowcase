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

  it('replaces category feeds with a combined featured list and member directory link', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(page).not.toContain('data-home-view-all');
    expect(page).not.toContain('buildHomepageCategoryWhere');
    expect(page).toContain('featuredItems.map');
    expect(page).toContain('href="/members"');
  });
});
