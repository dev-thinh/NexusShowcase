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

  // Zero Empty State: filter out categories with 0 published items, and take top 3
  return categories
    .filter((cat) => cat.items.length > 0)
    .slice(0, 3)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      layoutType: cat.layoutType,
      count: cat.items.length,
    }));
}
