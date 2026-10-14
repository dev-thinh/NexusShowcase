import type { Prisma } from '@prisma/client';

export function buildHomepageCategoryWhere(
  slug: string,
  baseWhere: Prisma.ShowcaseItemWhereInput,
): Prisma.ShowcaseItemWhereInput {
  return {
    ...baseWhere,
    category: { slug },
  };
}
