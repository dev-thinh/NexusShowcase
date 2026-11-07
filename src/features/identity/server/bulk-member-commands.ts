import 'server-only';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { commandFailure, StateConflict } from '@/server/db/command-error';
import type { ActionResult } from '@/shared/lib/action-result';
import type { Actor } from '../model/session';
import { bulkMemberCsvSchema, memberGrantSchema, memberLoginKey, type BulkMemberRow, type BulkMemberResult } from '../model/bulk-members';
import { parseMemberCsv } from '../model/member-csv';
import { createMember } from './member-commands';

const forbidden = () => ({ success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' });
async function isCurrentAdmin(actor: Actor) {
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return false;
  const current = await prisma.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
  return !!current && current.role === 'ADMIN' && current.status === 'ACTIVE' && !current.deletedAt && !current.mustChangePassword;
}

export async function previewBulkMembers(actor: Actor, input: unknown): Promise<ActionResult<BulkMemberRow[]>> {
  const parsed = bulkMemberCsvSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Vui lòng chọn CSV UTF-8 tối đa 128 KiB.' };
  let rows: BulkMemberRow[];
  try { rows = parseMemberCsv(parsed.data.csv); }
  catch (error) { return { success: false, code: 'VALIDATION', error: error instanceof Error ? error.message : 'Không đọc được CSV.' }; }
  try {
    if (!await isCurrentAdmin(actor)) return forbidden();
    const keys = [...new Set(rows.filter(row => row.email).map(row => memberLoginKey(row.email)))];
    if (keys.length) {
      const existing = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
        SELECT regexp_replace(lower(btrim(email)), '@(robotics|nexus)[.]hcmus[.]edu[.]vn$', '') AS key FROM users
        WHERE regexp_replace(lower(btrim(email)), '@(robotics|nexus)[.]hcmus[.]edu[.]vn$', '') IN (${Prisma.join(keys)})`);
      const taken = new Set(existing.map(row => row.key));
      for (const row of rows) if (taken.has(memberLoginKey(row.email))) row.errors.push('Tên đăng nhập/email đã tồn tại trong hệ thống.');
    }
    return { success: true, data: rows };
  } catch (error) { return commandFailure('member.bulk-preview', error, { actorId: actor.id }); }
}

export async function createBulkMembers(actor: Actor, input: unknown): Promise<ActionResult<BulkMemberResult[]>> {
  // Reparse the original document and recheck current identities; never trust the client preview.
  const preview = await previewBulkMembers(actor, input);
  if (!preview.success) return preview;
  const results: BulkMemberResult[] = [];
  for (const row of preview.data) {
    if (row.errors.length) { results.push({ ...row, status: 'SKIPPED', message: row.errors.join(' ') }); continue; }
    // Each identity has its own transaction and fresh admin check. No automatic
    // replay can replace credentials for a previously created identity.
    const result = await createMember(actor, { fullName: row.fullName, email: row.email, studentId: row.studentId || undefined, role: 'MEMBER', password: `Nexus-${randomBytes(18).toString('base64url')}` });
    results.push(result.success
      ? { ...row, status: 'CREATED', message: 'Đã tạo thành viên.', userId: result.data.user.id, temporaryPassword: result.data.temporaryPassword }
      : { ...row, status: 'FAILED', message: result.error });
  }
  return { success: true, data: results };
}

async function setBulkPublishingAccess(actor: Actor, input: unknown, grant: boolean): Promise<ActionResult<{ ids: string[] }>> {
  const parsed = memberGrantSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Chọn từ 1 đến 50 thành viên, không trùng nhau.' };
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return forbidden();
  try {
    return await prisma.$transaction(async tx => {
      const admin = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
      if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt || admin.mustChangePassword) return forbidden();
      const members = parsed.data.members;
      const eligible = { role: grant ? 'MEMBER' as const : 'CORE_MEMBER' as const, status: 'ACTIVE' as const, deletedAt: null, hiddenFromDirectory: false };
      const current = await tx.user.findMany({ where: { ...eligible, id: { in: members.map(member => member.id) } }, select: { id: true, sessionVersion: true } });
      if (current.length !== members.length || members.some(member => !current.some(user => user.id === member.id && user.sessionVersion === member.expectedVersion))) {
        return { success: false, code: 'CONFLICT', error: grant ? 'Có tài khoản đã thay đổi hoặc không còn đủ điều kiện. Chưa cấp quyền cho ai; hãy tải lại danh sách và chọn lại.' : 'Có tài khoản đã thay đổi hoặc không còn đủ điều kiện. Chưa thu hồi quyền của ai; hãy tải lại danh sách và chọn lại.' } as const;
      }
      const changed = await tx.user.updateMany({ where: { ...eligible, OR: members.map(member => ({ id: member.id, sessionVersion: member.expectedVersion })) }, data: { role: grant ? 'CORE_MEMBER' : 'MEMBER', sessionVersion: { increment: 1 } } });
      if (changed.count !== members.length) throw new StateConflict();
      return { success: true, data: { ids: members.map(member => member.id) } } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { return commandFailure(grant ? 'member.bulk-grant' : 'member.bulk-revoke', error, { actorId: actor.id }); }
}

export async function grantBulkMembers(actor: Actor, input: unknown) { return setBulkPublishingAccess(actor, input, true); }
export async function revokeBulkMembers(actor: Actor, input: unknown) { return setBulkPublishingAccess(actor, input, false); }
