import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { commandFailure, StateConflict } from '@/server/db/command-error';
import type { Actor } from '../model/session';
import { externalizeAuthors, memberLifecycleSchema } from '../model/member-lifecycle';

export async function manageMemberAccounts(actor: Actor, input: unknown) {
  const parsed = memberLifecycleSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: 'Danh sách tài khoản không hợp lệ.' };
  if (actor.role !== 'ADMIN' || actor.mustChangePassword || parsed.data.members.some(member => member.id === actor.id)) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Không thể thực hiện thao tác với tài khoản này.' };
  const { operation, members } = parsed.data;
  const ids = members.map(member => member.id);
  try {
    return await prisma.$transaction(async tx => {
      const admin = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
      if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt || admin.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
      const targets = await tx.user.findMany({ where: { id: { in: ids }, hiddenFromDirectory: false }, select: { id: true, fullName: true, role: true, status: true, deletedAt: true, sessionVersion: true } });
      if (targets.length !== ids.length || targets.some(target => target.sessionVersion !== members.find(member => member.id === target.id)!.expectedVersion)) return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản vừa thay đổi. Vui lòng tải lại và thử lại.' };
      if (targets.some(target => target.role === 'ADMIN')) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Không thể xóa hoặc vô hiệu hóa tài khoản quản trị viên.' };
      if (operation === 'DISABLE') {
        if (targets.some(target => target.status !== 'ACTIVE' || target.deletedAt)) return { success: false as const, code: 'VALIDATION' as const, error: 'Chỉ vô hiệu hóa tài khoản đang hoạt động.' };
        const changed = await tx.user.updateMany({ where: { OR: members.map(member => ({ id: member.id, sessionVersion: member.expectedVersion })), role: { not: 'ADMIN' }, status: 'ACTIVE', deletedAt: null }, data: { status: 'SUSPENDED', deletedAt: new Date(), sessionVersion: { increment: 1 } } });
        if (changed.count !== ids.length) throw new StateConflict();
      } else {
        const names = new Map(targets.map(target => [target.id, target.fullName]));
        const archive = await tx.user.upsert({ where: { id: 'system-deleted-account-archive' }, update: {}, create: { id: 'system-deleted-account-archive', email: 'deleted-account-archive@system.invalid', fullName: 'Tài khoản đã xóa', role: 'GUEST', status: 'SUSPENDED', hiddenFromDirectory: true }, select: { id: true } });
        for (const target of targets) await tx.itemContributor.updateMany({ where: { userId: target.id }, data: { userId: null, externalName: target.fullName } });
        // Snapshots are editable later; detach their contributor links as well.
        const jsonMatches = ids.map(id => ({ path: ['contributors'], array_contains: [{ userId: id }] }));
        const drafts = await tx.showcaseItem.findMany({ where: { OR: jsonMatches.map(authorDraft => ({ authorDraft })) }, select: { id: true, authorDraft: true, reviewVersion: true } });
        for (const draft of drafts) await tx.showcaseItem.update({ where: { id: draft.id }, data: { authorDraft: externalizeAuthors(draft.authorDraft, names) as Prisma.InputJsonValue, ...(draft.reviewVersion > 0 ? { reviewVersion: { increment: 1 } } : {}) } });
        const revisions = await tx.submissionRevision.findMany({ where: { OR: jsonMatches.map(snapshot => ({ snapshot })) }, select: { id: true, snapshot: true } });
        for (const revision of revisions) await tx.submissionRevision.update({ where: { id: revision.id }, data: { snapshot: externalizeAuthors(revision.snapshot, names) as Prisma.InputJsonValue } });
        const overrides = await tx.editorialDraft.findMany({ where: { OR: jsonMatches.map(overrides => ({ overrides })) }, select: { id: true, overrides: true } });
        for (const draft of overrides) await tx.editorialDraft.update({ where: { id: draft.id }, data: { overrides: externalizeAuthors(draft.overrides, names) as Prisma.InputJsonValue } });
        // Zero marks legacy editorial overrides; keep that marker until the review workflow migrates it.
        await tx.showcaseItem.updateMany({ where: { creatorId: { in: ids }, reviewVersion: { gt: 0 } }, data: { reviewVersion: { increment: 1 } } });
        await tx.showcaseItem.updateMany({ where: { creatorId: { in: ids } }, data: { creatorId: archive.id } });
        await tx.submissionRevision.updateMany({ where: { submittedById: { in: ids } }, data: { submittedById: archive.id } });
        await tx.reviewComment.updateMany({ where: { authorId: { in: ids } }, data: { authorId: archive.id } });
        await tx.auditEvent.updateMany({ where: { actorId: { in: ids } }, data: { actorId: archive.id } });
        // Nullable editor/resolver links use their existing SetNull foreign keys.
        await tx.asset.updateMany({ where: { ownerId: { in: ids } }, data: { ownerId: null } });
        await tx.uploadReservation.deleteMany({ where: { ownerId: { in: ids } } });
        const deleted = await tx.user.deleteMany({ where: { OR: members.map(member => ({ id: member.id, sessionVersion: member.expectedVersion })), role: { not: 'ADMIN' } } });
        if (deleted.count !== ids.length) throw new StateConflict();
      }
      return { success: true as const, data: { ids, count: ids.length } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
  } catch (error) { return commandFailure('member.lifecycle', error, { actorId: actor.id }); }
}
