import { prisma } from '@/lib/prisma';

export interface FeaturedNavCategory {
  id: string;
  name: string;
  slug: string;
  layoutType: string;
  count: number;
}

export async function getFeaturedNavCategories(isAuthenticated: boolean): Promise<FeaturedNavCategory[]> {
  const itemWhere = isAuthenticated
    ? { status: 'PUBLISHED' as const }
    : { status: 'PUBLISHED' as const, visibility: 'PUBLIC' as const };

  const categories = await prisma.category.findMany({
    where: {
      isNavFeatured: true,
      slug: { in: ['bai-bao-khoa-hoc', 'robotics-iot'] },
    },
    include: {
      items: {
        where: itemWhere,
        select: { id: true },
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  // Show the two supported categories when they have published items.
  return categories
    .filter((cat) => cat.items.length > 0)
    .slice(0, 2)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      layoutType: cat.layoutType,
      count: cat.items.length,
    }));
}
