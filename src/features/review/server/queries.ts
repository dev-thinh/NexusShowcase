import { prisma } from '@/server/db/prisma';
import { pageBounds } from '@/shared/lib/pagination';
import { Prisma, type ItemStatus } from '@prisma/client';
import 'server-only';
import { pendingReviewWhere } from '../model/review-state';

export async function listReviewQueue(rawPage: unknown, query = '') {
  // Read only list fields from the immutable submitted snapshot. Legacy overrides
  // apply only to version zero, matching the detail-page snapshot resolver.
  const source = Prisma.sql`
    SELECT i.id, i.status, i."updatedAt", u."fullName" AS "creatorName",
      COALESCE(CASE WHEN i."reviewVersion" = 0 THEN e.overrides->>'title' END, r.snapshot->>'title', i.title) AS title,
      COALESCE(CASE WHEN i."reviewVersion" = 0 THEN e.overrides->>'summary' END, r.snapshot->>'summary', i.summary) AS summary,
      COALESCE(CASE WHEN i."reviewVersion" = 0 THEN e.overrides->>'publishedYear' END, r.snapshot->>'publishedYear', i."publishedYear"::text) AS "publishedYear"
    FROM showcase_items i JOIN users u ON u.id = i."creatorId"
    LEFT JOIN LATERAL (SELECT snapshot FROM submission_revisions WHERE "itemId" = i.id ORDER BY "revisionNumber" DESC LIMIT 1) r ON TRUE
    LEFT JOIN editorial_drafts e ON e."itemId" = i.id
    WHERE i.status::text IN ('PENDING_REVIEW', 'READY_FOR_APPROVAL') OR (i.status = 'PUBLISHED' AND i."reviewStatus" = 'PENDING_REVIEW')`;
  const q = query.trim().slice(0, 200);
  const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  const matches = q ? Prisma.sql`WHERE title ILIKE ${pattern} OR "creatorName" ILIKE ${pattern}` : Prisma.empty;
  const total = q
    ? (await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT count(*)::integer AS total FROM (${source}) queue ${matches}`))[0].total
    : await prisma.showcaseItem.count({ where: pendingReviewWhere });
  const bounds = pageBounds(rawPage, total, 20);
  const items = await prisma.$queryRaw<Array<{ id: string; status: ItemStatus; title: string; summary: string; publishedYear: string | null; creatorName: string }>>(Prisma.sql`SELECT id, status, "creatorName", title, summary, "publishedYear" FROM (${source}) queue ${matches} ORDER BY "updatedAt" ASC, id ASC LIMIT ${bounds.take} OFFSET ${bounds.skip}`);
  return { items, total, page: bounds.page, totalPages: bounds.totalPages, pageSize: 20 };
}
