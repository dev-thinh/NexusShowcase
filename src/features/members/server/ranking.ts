import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';
import 'server-only';
import { type MemberDirectoryEntry, type PublicMemberRole } from '../model/directory';

const hasVietnameseCollation = cache(async () => {
  const [row] = await prisma.$queryRaw<Array<{ available: boolean }>>`SELECT EXISTS (SELECT 1 FROM pg_collation WHERE collname = 'vi-x-icu') AS available`;
  return row.available;
});

export async function rankedMembers(input: { authenticated: boolean; role?: PublicMemberRole; take: number; skip: number }): Promise<MemberDirectoryEntry[]> {
  // Both collation paths stay bounded in SQL; never hydrate the whole directory.
  const nameOrder = await hasVietnameseCollation() ? Prisma.sql`u."fullName" COLLATE "vi-x-icu"` : Prisma.sql`u."fullName"`;
  type Row = Omit<MemberDirectoryEntry, '_count'> & { contributionCount: number };
  const role = input.role ? Prisma.sql`AND u.role::text = ${input.role}` : Prisma.empty;
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT u.id, u."publicSlug", u."fullName", u."avatarUrl", u.bio, u."githubUrl", u."linkedinUrl", u."googleScholarUrl", u."portfolioUrl", u."profileLinks", u.role,
      count(i.id)::integer AS "contributionCount"
    FROM users u
    LEFT JOIN item_contributors c ON c."userId" = u.id
    LEFT JOIN showcase_items i ON i.id = c."itemId" AND i.status = 'PUBLISHED' AND (${input.authenticated} OR i.visibility = 'PUBLIC')
    WHERE u.status = 'ACTIVE' AND u."deletedAt" IS NULL AND u."hiddenFromDirectory" = false AND u.role::text IN ('ADMIN', 'CORE_MEMBER', 'MEMBER') ${role}
    GROUP BY u.id
    ORDER BY CASE u.role::text WHEN 'ADMIN' THEN 0 WHEN 'CORE_MEMBER' THEN 1 ELSE 2 END,
      count(i.id) DESC, ${nameOrder}, u.id
    LIMIT ${input.take} OFFSET ${input.skip}`);
  return rows.map(({ contributionCount, ...member }) => ({ ...member, _count: { contributions: contributionCount } }));
}
