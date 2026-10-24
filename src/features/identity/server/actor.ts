import { getSession } from '@/features/identity/server/session';
import { prisma } from '@/server/db/prisma';
import type { Role } from '@prisma/client';
import 'server-only';
import type { Actor } from '../model/session';

export async function getActor(
  allowedRoles?: readonly Role[],
  options: { allowPasswordChangeRequired?: boolean } = {},
): Promise<Actor | null> {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, role: true, status: true, deletedAt: true, mustChangePassword: true },
  });
  if (!user || user.status !== 'ACTIVE' || user.deletedAt) return null;
  if (user.mustChangePassword && !options.allowPasswordChangeRequired) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return { id: user.id, fullName: user.fullName, role: user.role, status: 'ACTIVE', mustChangePassword: user.mustChangePassword };
}
