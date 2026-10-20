import 'server-only';

import { getSession as auth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

const currentUserSelect = {
  id: true,
  fullName: true,
  role: true,
  status: true,
  deletedAt: true,
  mustChangePassword: true,
} as const;

export type CurrentUser = {
  id: string;
  fullName: string;
  role: Role;
  status: 'ACTIVE';
};

export async function getCurrentUser(allowedRoles?: Role[]): Promise<CurrentUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: currentUserSelect,
  });

  if (!user || user.status !== 'ACTIVE' || user.deletedAt || user.mustChangePassword) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return { ...user, status: 'ACTIVE' };
}

export async function requireCurrentUser(allowedRoles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser(allowedRoles);
  if (!user) throw new Error('Unauthorized');
  return user;
}
