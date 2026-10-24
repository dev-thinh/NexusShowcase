import { prisma } from '@/server/db/prisma';
import 'server-only';

export function selectedContributors(ids: string[]) {
  return prisma.user.findMany({ where: { id: { in: [...new Set(ids)].slice(0, 20) } }, select: { id: true, fullName: true } });
}
