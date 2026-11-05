import { Prisma } from '@prisma/client';
import { literalSearchPattern } from '@/shared/lib/search-text';

export function boundedPublicationQuery(value?: string): string { return (value ?? '').trim().slice(0, 200); }
const folded = (expression: Prisma.Sql) => Prisma.sql`regexp_replace(translate(normalize(lower(${expression}), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g')`;
export function publicationSearchPredicate(input: { authenticated: boolean; q: string; categoryId?: string; categorySlug?: string; year?: number }): Prisma.Sql {
  const pattern = literalSearchPattern(boundedPublicationQuery(input.q));
  return Prisma.sql`status = 'PUBLISHED'
    AND ${input.authenticated ? Prisma.sql`TRUE` : Prisma.sql`visibility = 'PUBLIC'`}
    AND ${input.categoryId ? Prisma.sql`"categoryId" = ${input.categoryId}` : input.categorySlug ? Prisma.sql`EXISTS (SELECT 1 FROM categories category WHERE category.id = showcase_items."categoryId" AND category.slug = ${input.categorySlug})` : Prisma.sql`TRUE`}
    AND ${input.year ? Prisma.sql`"publishedYear" = ${input.year}` : Prisma.sql`TRUE`}
    AND (${folded(Prisma.sql`title || ' ' || summary`)} LIKE ${pattern}
      OR EXISTS (SELECT 1 FROM item_contributors contributor LEFT JOIN users author ON author.id = contributor."userId"
        WHERE contributor."itemId" = showcase_items.id
          AND ${folded(Prisma.sql`coalesce(author."fullName", '') || ' ' || coalesce(contributor."externalName", '')`)} LIKE ${pattern}))`;
}
export function publicationSearchOrder(sort: 'featured' | 'newest' | 'oldest' | 'title'): Prisma.Sql {
  return sort === 'title' ? Prisma.sql`title ASC, id ASC`
    : sort === 'oldest' ? Prisma.sql`"publishedYear" ASC, "createdAt" ASC, id ASC`
    : sort === 'newest' ? Prisma.sql`"publishedYear" DESC, "createdAt" DESC, id ASC`
    : Prisma.sql`"isPinned" DESC, "publishedYear" DESC, "createdAt" DESC, id ASC`;
}
