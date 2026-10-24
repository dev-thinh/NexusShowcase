import { publicUserSelect } from '@/features/identity/model/public-user';
import { publishedWhere } from '@/features/publications/model/visibility';
import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';
import 'server-only';
import { sortMembersByContribution, type MemberDirectoryEntry, type PublicMemberRole } from '../model/directory';

const hasVietnameseCollation = cache(async () => {
  const [row] = await prisma.$queryRaw<Array<{ available: boolean }>>`SELECT EXISTS (SELECT 1 FROM pg_collation WHERE collname = 'vi-x-icu') AS available`;
  return row.available;
});

export async function rankedMembers(input: { authenticated: boolean; role?: PublicMemberRole; take: number; skip: number }): Promise<MemberDirectoryEntry[]> {
  if (!await hasVietnameseCollation()) {
    // Explicit compatibility fallback: scan ranking metadata only, hydrate the requested page.
    const where = { status: 'ACTIVE' as const, deletedAt: null, role: input.role ?? { in: ['ADMIN', 'CORE_MEMBER', 'MEMBER'] as PublicMemberRole[] } };
    const counts = { select: { contributions: { where: { item: publishedWhere(input.authenticated) } } } };
    const metadata = await prisma.user.findMany({ where, select: { id: true, fullName: true, role: true, _count: counts } });
    const priority = { ADMIN: 0, CORE_MEMBER: 1, MEMBER: 2 };
    const ordered = sortMembersByContribution(metadata).sort((a, b) => input.role ? 0 : priority[a.role as PublicMemberRole] - priority[b.role as PublicMemberRole]);
    const ids = ordered.slice(input.skip, input.skip + input.take).map(member => member.id);
    const members = await prisma.user.findMany({ where: { id: { in: ids } }, select: { ...publicUserSelect, _count: counts } });
    return ids.flatMap(id => { const member = members.find(member => member.id === id); return member ? [member as MemberDirectoryEntry] : []; });
  }
  type Row = Omit<MemberDirectoryEntry, '_count'> & { contributionCount: number };
  const role = input.role ? Prisma.sql`AND u.role::text = ${input.role}` : Prisma.empty;
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT u.id, u."fullName", u."avatarUrl", u.bio, u."githubUrl", u."linkedinUrl", u."googleScholarUrl", u."portfolioUrl", u.role,
      count(i.id)::integer AS "contributionCount"
    FROM users u
    LEFT JOIN item_contributors c ON c."userId" = u.id
    LEFT JOIN showcase_items i ON i.id = c."itemId" AND i.status = 'PUBLISHED' AND (${input.authenticated} OR i.visibility = 'PUBLIC')
    WHERE u.status = 'ACTIVE' AND u."deletedAt" IS NULL AND u.role::text IN ('ADMIN', 'CORE_MEMBER', 'MEMBER') ${role}
    GROUP BY u.id
    ORDER BY CASE u.role::text WHEN 'ADMIN' THEN 0 WHEN 'CORE_MEMBER' THEN 1 ELSE 2 END,
      count(i.id) DESC, u."fullName" COLLATE "vi-x-icu", u.id
    LIMIT ${input.take} OFFSET ${input.skip}`);
  return rows.map(({ contributionCount, ...member }) => ({ ...member, _count: { contributions: contributionCount } }));
}
