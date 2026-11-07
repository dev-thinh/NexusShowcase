import 'server-only';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { commandFailure, StateConflict } from '@/server/db/command-error';
import { memberGrantSchema } from '../model/bulk-members';
import type { Actor } from '../model/session';

export async function resetBulkMemberPasswords(actor: Actor, input: unknown) {
  const parsed = memberGrantSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: 'Danh sách tài khoản không hợp lệ.' };
  if (actor.role !== 'ADMIN' || actor.mustChangePassword || parsed.data.members.some(member => member.id === actor.id)) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Không thể thực hiện thao tác với tài khoản này.' };
  const members = parsed.data.members;
  const eligible = { role: { not: 'ADMIN' as const }, status: 'ACTIVE' as const, deletedAt: null, hiddenFromDirectory: false };
  const versioned = members.map(member => ({ id: member.id, sessionVersion: member.expectedVersion }));
  try {
    // Reject stale batches before hashing, then recheck everything inside the write transaction.
    if (await prisma.user.count({ where: { ...eligible, OR: versioned } }) !== members.length) return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản vừa thay đổi. Vui lòng tải lại và thử lại.' };
    const credentials = members.map(member => ({ ...member, temporaryPassword: `N!${randomBytes(24).toString('base64url')}`, passwordHash: '' }));
    let index = 0;
    await Promise.all(Array.from({ length: Math.min(4, credentials.length) }, async () => {
      while (index < credentials.length) {
        const credential = credentials[index++];
        credential.passwordHash = await bcrypt.hash(credential.temporaryPassword, 12);
      }
    }));
    return await prisma.$transaction(async tx => {
      const admin = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
      if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt || admin.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
      const current = await tx.user.findMany({ where: { ...eligible, OR: versioned }, select: { id: true, fullName: true, email: true } });
      if (current.length !== members.length) return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản vừa thay đổi. Vui lòng tải lại và thử lại.' };
      for (const credential of credentials) {
        const changed = await tx.user.updateMany({ where: { ...eligible, id: credential.id, sessionVersion: credential.expectedVersion }, data: { passwordHash: credential.passwordHash, mustChangePassword: true, temporaryPasswordConsumed: false, sessionVersion: { increment: 1 } } });
        if (changed.count !== 1) throw new StateConflict();
      }
      return { success: true as const, data: { credentials: credentials.map(credential => ({ ...current.find(user => user.id === credential.id)!, temporaryPassword: credential.temporaryPassword })) } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });
  } catch (error) { return commandFailure('member.bulk-reset', error, { actorId: actor.id }); }
}
