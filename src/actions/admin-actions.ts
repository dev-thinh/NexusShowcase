'use server';

import { prisma } from '@/lib/prisma';
import { canUserReview } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function updateUserRoleAction(adminId: string, targetUserId: string, newRole: Role) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !canUserReview(admin)) {
    return { success: false, error: 'Chỉ Thầy chủ nhiệm mới có quyền phân quyền thành viên.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  return { success: true, user: updatedUser };
}
