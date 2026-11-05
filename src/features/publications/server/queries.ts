import { prisma } from '@/server/db/prisma';
import { pageBounds, type Page } from '@/shared/lib/pagination';
import { Prisma } from '@prisma/client';
import 'server-only';
import type { PublicationCardDto } from '../model/contracts';
import { publishedWhere } from '../model/visibility';
import { publicationCardSelect } from './selects';
import { boundedPublicationQuery, publicationSearchPredicate, publicationSearchOrder } from './search';

export async function listPublications(input: { authenticated: boolean; categorySlug?: string; categoryId?: string; q?: string; year?: number; sort: 'featured' | 'newest' | 'oldest' | 'title'; page: unknown; pageSize: 9 | 10 }): Promise<Page<PublicationCardDto>> {
  const q = boundedPublicationQuery(input.q);
  const where: Prisma.ShowcaseItemWhereInput = {
    ...(input.categoryId ? { categoryId: input.categoryId } : input.categorySlug ? { category: { slug: input.categorySlug } } : {}),
    ...(input.year ? { publishedYear: input.year } : {}),
    ...publishedWhere(input.authenticated),
  };
  const predicate = q ? publicationSearchPredicate({ ...input, q }) : null;
  const total = predicate
    ? Number((await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM showcase_items WHERE ${predicate}`))[0].total)
    : await prisma.showcaseItem.count({ where });
  const { page, skip, take, totalPages } = pageBounds(input.page, total, input.pageSize);
  const orderBy: Prisma.ShowcaseItemOrderByWithRelationInput[] = input.sort === 'title' ? [{ title: 'asc' }, { id: 'asc' }]
    : input.sort === 'oldest' ? [{ publishedYear: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
    : input.sort === 'newest' ? [{ publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }]
    : [{ isPinned: 'desc' }, { publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
  const ids = predicate ? await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM showcase_items WHERE ${predicate} ORDER BY ${publicationSearchOrder(input.sort)} LIMIT ${take} OFFSET ${skip}`) : null;
  const items = await prisma.showcaseItem.findMany({ where: { ...where, ...(ids ? { id: { in: ids.map(row => row.id) } } : {}) }, select: publicationCardSelect, skip: ids ? 0 : skip, take, orderBy });
  return { items, page, pageSize: take, total, totalPages };
}

export function getHomePublications(authenticated: boolean): Promise<PublicationCardDto[]> {
  return prisma.showcaseItem.findMany({ where: publishedWhere(authenticated), select: publicationCardSelect, take: 3, orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }] });
}

export async function listMemberPublications(input: { memberId: string; authenticated: boolean; type?: 'PROJECT' | 'RESEARCH_PAPER'; page: unknown; pageSize?: 6 | 20 }): Promise<Page<PublicationCardDto>> {
  const where: Prisma.ShowcaseItemWhereInput = { contributors: { some: { userId: input.memberId } }, type: input.type, ...publishedWhere(input.authenticated) };
  const total = await prisma.showcaseItem.count({ where });
  const { page, skip, take, totalPages } = pageBounds(input.page, total, input.pageSize ?? 20);
  const items = await prisma.showcaseItem.findMany({ where, select: publicationCardSelect, skip, take, orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }] });
  return { items, total, page, pageSize: take, totalPages };
}
