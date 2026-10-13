import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  category: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { getFeaturedNavCategories } from '@/lib/nav-categories';

describe('getFeaturedNavCategories (Zero Empty State & Top 3 Limit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters out featured categories with 0 items for guests', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Bài báo khoa học',
        slug: 'publications',
        layoutType: 'BIBLIOGRAPHY',
        displayOrder: 1,
        items: [{ id: 'item-1' }],
      },
      {
        id: 'cat-2',
        name: 'Giải thưởng',
        slug: 'awards',
        layoutType: 'HONOR_ROLL',
        displayOrder: 2,
        items: [], // 0 items!
      },
    ]);

    const result = await getFeaturedNavCategories(false);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('publications');
    expect(result[0].layoutType).toBe('BIBLIOGRAPHY');
    expect(result[0].count).toBe(1);
  });

  it('limits to Top 3 featured categories even if more qualify', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { id: '1', name: 'Cat 1', slug: 'cat-1', layoutType: 'SHOWCASE_GRID', displayOrder: 1, items: [{ id: 'i1' }] },
      { id: '2', name: 'Cat 2', slug: 'cat-2', layoutType: 'SHOWCASE_GRID', displayOrder: 2, items: [{ id: 'i2' }] },
      { id: '3', name: 'Cat 3', slug: 'cat-3', layoutType: 'SHOWCASE_GRID', displayOrder: 3, items: [{ id: 'i3' }] },
      { id: '4', name: 'Cat 4', slug: 'cat-4', layoutType: 'SHOWCASE_GRID', displayOrder: 4, items: [{ id: 'i4' }] },
    ]);

    const result = await getFeaturedNavCategories(true);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.slug)).toEqual(['cat-1', 'cat-2', 'cat-3']);
  });
});
