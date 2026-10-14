import { describe, expect, it } from 'vitest';
import { buildHomepageCategoryWhere } from '@/lib/home-section-filters';

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
});
