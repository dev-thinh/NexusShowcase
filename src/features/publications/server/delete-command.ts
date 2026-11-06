import 'server-only';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { commandFailure, StateConflict } from '@/server/db/command-error';
import type { Actor } from '@/features/identity/model/session';

const inputSchema = z.object({ itemId: z.string().cuid(), expectedVersion: z.number().int().nonnegative() }).strict();
export async function deletePublishedPost(actor: Actor, input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: 'Thông tin bài đăng không hợp lệ.' };
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Chỉ quản trị viên được xóa bài đăng.' };
  try {
    return await prisma.$transaction(async tx => {
      const admin = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
      if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt || admin.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
      const item = await tx.showcaseItem.findUnique({ where: { id: parsed.data.itemId }, select: { slug: true, creatorId: true, contributors: { select: { userId: true } } } });
      if (!item) return { success: false as const, code: 'NOT_FOUND' as const, error: 'Không tìm thấy bài đăng.' };
      const deleted = await tx.showcaseItem.deleteMany({ where: { id: parsed.data.itemId, reviewVersion: parsed.data.expectedVersion, status: 'PUBLISHED' } });
      if (deleted.count !== 1) throw new StateConflict();
      return { success: true as const, data: { slugs: [item.slug], memberIds: [item.creatorId, ...item.contributors.flatMap(contributor => contributor.userId ? [contributor.userId] : [])] } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { return commandFailure('publication.delete', error, { actorId: actor.id }); }
}
