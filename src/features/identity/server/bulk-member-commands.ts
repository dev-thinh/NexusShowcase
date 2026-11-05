import 'server-only';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { commandFailure } from '@/server/db/command-error';
import type { ActionResult } from '@/shared/lib/action-result';
import type { Actor } from '../model/session';
import { bulkMemberCsvSchema, memberLoginKey, type BulkMemberRow, type BulkMemberResult } from '../model/bulk-members';
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
