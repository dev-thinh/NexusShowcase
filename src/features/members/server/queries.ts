import { prisma } from '@/server/db/prisma';
import { pageBounds, type Page } from '@/shared/lib/pagination';
import 'server-only';
import type { MemberDirectoryEntry, PublicMemberRole } from '../model/directory';
import { rankedMembers } from './ranking';
import { Prisma } from '@prisma/client';
import { homeMemberSlots, type HomeMember, type HomeMembersPayload } from '../model/home';

export async function listDirectory(input: { authenticated: boolean; role: PublicMemberRole; page: unknown; pageSize: 6 | 12 }): Promise<Page<MemberDirectoryEntry>> {
  const total = await prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null, role: input.role } });
  const { page, skip, take, totalPages } = pageBounds(input.page, total, input.pageSize);
  const items = await rankedMembers({ ...input, skip, take });
  return { items, total, page, pageSize: take, totalPages };
}
export function getHomeMembers(): Promise<HomeMembersPayload> {
  return prisma.$transaction(async tx => {
    const roles = ['ADMIN', 'CORE_MEMBER', 'MEMBER'] as const;
    const groups = await tx.user.groupBy({
      by: ['role'],
      where: { status: 'ACTIVE', deletedAt: null, role: { in: [...roles] } },
      _count: { _all: true },
    });
    const counts = { ADMIN: 0, CORE_MEMBER: 0, MEMBER: 0 };
    for (const group of groups) if (group.role in counts) counts[group.role as PublicMemberRole] = group._count._all;
    const slots = homeMemberSlots(counts);
    const members: HomeMember[] = [];
    for (const role of roles) {
      if (!slots[role]) continue;
      const order = role === 'ADMIN' ? Prisma.sql`"fullName", id` : Prisma.sql`random(), id`;
      const sample = await tx.$queryRaw<HomeMember[]>(Prisma.sql`
        SELECT id, "fullName", "avatarUrl", role
        FROM users
        WHERE status = 'ACTIVE' AND "deletedAt" IS NULL AND role::text = ${role}
        ORDER BY ${order}
        LIMIT ${slots[role]}`);
      if (role === 'ADMIN') sample.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi') || a.id.localeCompare(b.id));
      members.push(...sample);
    }
    return { members, total: counts.ADMIN + counts.CORE_MEMBER + counts.MEMBER };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
