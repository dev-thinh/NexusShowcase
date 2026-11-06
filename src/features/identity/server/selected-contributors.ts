import { prisma } from '@/server/db/prisma';
import 'server-only';

export function selectedContributors(ids: string[]) {
  if (!ids.length) return Promise.resolve([]);
  return prisma.user.findMany({ where: { hiddenFromDirectory: false, id: { in: [...new Set(ids)].slice(0, 20) } }, select: { id: true, fullName: true } });
}
