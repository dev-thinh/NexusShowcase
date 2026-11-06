import type { Actor } from '@/features/identity/model/session';
import { prisma } from '@/server/db/prisma';
import { pageBounds } from '@/shared/lib/pagination';
import { literalSearchPattern } from '@/shared/lib/search-text';
import { Prisma } from '@prisma/client';
import 'server-only';
import { matchesPostFilter, postFilters, type PostFilter } from '../model/dashboard-items';

const authorSelect = {
  id: true, creatorId: true, slug: true, title: true, summary: true, type: true, status: true,
  reviewStatus: true, reviewVersion: true, rejectionReason: true, publishedYear: true,
  updatedAt: true, thumbnailUrl: true,
} satisfies Prisma.ShowcaseItemSelect;

function workflowWhere(filter: PostFilter): Prisma.ShowcaseItemWhereInput {
  if (filter === 'ALL') return {};
  if (filter === 'PENDING_REVIEW') return { OR: [{ status: { in: ['PENDING_REVIEW', 'READY_FOR_APPROVAL'] } }, { status: 'PUBLISHED', reviewStatus: { in: ['PENDING_REVIEW', 'READY_FOR_APPROVAL'] } }] };
  if (filter === 'REVISION_REQUESTED' || filter === 'REJECTED') return { OR: [{ status: filter }, { reviewStatus: filter }] };
  return { status: filter };
}

export async function listAuthorItems(input: { actor: Actor; filter: PostFilter; q: string; page: unknown }) {
  const membership: Prisma.ShowcaseItemWhereInput = { OR: [{ creatorId: input.actor.id }, { contributors: { some: { userId: input.actor.id } } }] };
  const where: Prisma.ShowcaseItemWhereInput = { AND: [membership, workflowWhere(input.filter)] };
  const present = (items: Array<Prisma.ShowcaseItemGetPayload<{ select: typeof authorSelect }>>) => items.map(item => ({
    ...item, canManage: item.creatorId === input.actor.id,
    ...(item.creatorId === input.actor.id ? {} : { reviewVersion: 0, rejectionReason: null }),
  }));
  // Accent folding happens in PostgreSQL; only IDs for the requested page are hydrated.
  if (input.q.trim()) {
    const workflow = input.filter === 'ALL' ? Prisma.sql`TRUE`
      : input.filter === 'PENDING_REVIEW' ? Prisma.sql`(status::text IN ('PENDING_REVIEW', 'READY_FOR_APPROVAL') OR (status = 'PUBLISHED' AND "reviewStatus"::text IN ('PENDING_REVIEW', 'READY_FOR_APPROVAL')))`
      : input.filter === 'REVISION_REQUESTED' || input.filter === 'REJECTED' ? Prisma.sql`(status::text = ${input.filter} OR "reviewStatus"::text = ${input.filter})`
      : Prisma.sql`status::text = ${input.filter}`;
    const actorScope = Prisma.sql`("creatorId" = ${input.actor.id} OR EXISTS (SELECT 1 FROM item_contributors c WHERE c."itemId" = showcase_items.id AND c."userId" = ${input.actor.id}))`;
    const predicate = Prisma.sql`${actorScope} AND ${workflow} AND regexp_replace(translate(normalize(lower(title || ' ' || summary), NFD), 'đ', 'd'), ${'[\u0300-\u036f]'}, '', 'g') LIKE ${literalSearchPattern(input.q.trim())}`;
    const [count] = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM showcase_items WHERE ${predicate}`);
    const total = Number(count.total);
    const bounds = pageBounds(input.page, total, 10);
    const ids = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM showcase_items WHERE ${predicate} ORDER BY "createdAt" DESC, id ASC LIMIT ${bounds.take} OFFSET ${bounds.skip}`);
    const items = await prisma.showcaseItem.findMany({ where: { ...where, id: { in: ids.map(row => row.id) } }, select: authorSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 10 });
    return { items: present(items), total, page: bounds.page, totalPages: bounds.totalPages, pageSize: 10 };
  }
  const total = await prisma.showcaseItem.count({ where });
  const bounds = pageBounds(input.page, total, 10);
  const items = await prisma.showcaseItem.findMany({ where, select: authorSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: bounds.skip, take: bounds.take });
  return { items: present(items), total, page: bounds.page, totalPages: bounds.totalPages, pageSize: 10 };
}

export async function authorItemStats(actor: Actor) {
  const groups = await prisma.showcaseItem.groupBy({ by: ['status', 'reviewStatus'], where: { OR: [{ creatorId: actor.id }, { contributors: { some: { userId: actor.id } } }] }, _count: { _all: true } });
  return Object.fromEntries(postFilters.map(filter => [filter.value, groups.reduce((sum, group) => sum + (matchesPostFilter(group, filter.value) ? group._count._all : 0), 0)])) as Record<PostFilter, number>;
}
