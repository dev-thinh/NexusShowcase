import { userRoleUpdateInputSchema } from '@/features/identity/model/member-input';
import { commandFailure } from '@/server/db/command-error';
import { prisma } from '@/server/db/prisma';
import { reportServerError } from '@/server/observability/errors';
import type { ActionResult } from '@/shared/lib/action-result';
import { Prisma, type Role } from '@prisma/client';
import 'server-only';
import type { Actor } from '../model/session';

const safeMemberSelect = { id: true, fullName: true, role: true, status: true } as const;
export type SafeMember = Prisma.UserGetPayload<{ select: typeof safeMemberSelect }>;

export async function updateMemberRole(actor: Actor, input: { targetUserId: string; newRole: Role }): Promise<ActionResult<SafeMember>> {
  const parsed = userRoleUpdateInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: 'VALIDATION', error: 'Thông tin phân quyền không hợp lệ.' };
  const { targetUserId, newRole } = parsed.data;
  if (actor.id === targetUserId && newRole !== 'ADMIN') return { success: false, code: 'FORBIDDEN', error: 'Ban chủ nhiệm không thể tự hạ quyền.' };
  try {
    return await prisma.$transaction(async tx => {
      const current = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
      if (!current || current.role !== 'ADMIN' || current.status !== 'ACTIVE' || current.deletedAt || current.mustChangePassword) return { success: false, code: 'FORBIDDEN', error: 'Bạn không còn quyền quản trị.' } as const;
      const target = await tx.user.findUnique({ where: { id: targetUserId }, select: { ...safeMemberSelect, deletedAt: true } });
      if (!target || target.deletedAt || target.status !== 'ACTIVE') return { success: false, code: 'NOT_FOUND', error: 'Không tìm thấy thành viên đang hoạt động.' } as const;
      if (target.role === 'ADMIN' && newRole !== 'ADMIN') {
        const admins = await tx.user.count({ where: { role: 'ADMIN', status: 'ACTIVE', deletedAt: null } });
        if (admins <= 1) return { success: false, code: 'FORBIDDEN', error: 'Phải giữ ít nhất một thành viên Ban chủ nhiệm đang hoạt động.' } as const;
      }
      const user = await tx.user.update({ where: { id: targetUserId }, data: { role: newRole, sessionVersion: { increment: 1 } }, select: safeMemberSelect });
      return { success: true, data: user } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return { success: false, code: 'CONFLICT', error: 'Quyền vừa thay đổi. Vui lòng tải lại và thử lại.' };
    reportServerError('member.role', error, { actorId: actor.id });
    return { success: false, code: 'INTERNAL', error: 'Không cập nhật được quyền thành viên.' };
  }
}

import { INVALID_ACTION_INPUT_ERROR } from '@/shared/lib/validation';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { createMemberInputSchema, deleteMemberInputSchema, type CreateMemberInput } from '../model/member-input';
function toSafeMember(user: { id: string; fullName: string; role: Role; status: string }) {
  return { id: user.id, fullName: user.fullName, role: user.role, status: user.status };
}

async function createMemberInternal(actor: Actor, input: CreateMemberInput) {
  const admin = actor.role === 'ADMIN' && !actor.mustChangePassword ? actor : null;
  if (!admin) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Chỉ Ban chủ nhiệm mới có quyền tạo tài khoản thành viên.' };
  }

  const parsedInput = createMemberInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false as const, code: 'VALIDATION' as const, error: INVALID_ACTION_INPUT_ERROR };
  }
  input = parsedInput.data;

  if (!input.fullName?.trim()) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Vui lòng nhập họ và tên của thành viên.' };
  }

  if (!input.email?.trim()) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Vui lòng nhập email hoặc tên đăng nhập của thành viên.' };
  }

  const emailTrimmed = input.email.trim().toLowerCase();
  const rawPassword = input.password?.trim() || crypto.randomBytes(12).toString('base64url');
  if (rawPassword.length < 15) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Mật khẩu phải có độ dài tối thiểu 15 ký tự.' };
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  return prisma.$transaction(async tx => {
    const current = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
    if (!current || current.role !== 'ADMIN' || current.status !== 'ACTIVE' || current.deletedAt || current.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
    const family = emailTrimmed.replace(/@(robotics|nexus)\.hcmus\.edu\.vn$/, '');
    const matches = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM users WHERE regexp_replace(lower(btrim(email)), '@(robotics|nexus)[.]hcmus[.]edu[.]vn$', '') = ${family} LIMIT 1`);
    if (matches.length) return { success: false as const, code: 'VALIDATION' as const, error: 'Tài khoản hoặc email đã tồn tại trong hệ thống.' };
    const newUser = await tx.user.create({
    data: {
      fullName: input.fullName.trim(),
      email: emailTrimmed,
      studentId: input.studentId?.trim() || null,
      role: input.role || 'MEMBER',
      status: 'ACTIVE',
      passwordHash,
      mustChangePassword: true,
      sessionVersion: 1,
    },
    select: { id: true, fullName: true, role: true, status: true },
  });

  return { success: true as const, data: { user: toSafeMember(newUser), temporaryPassword: rawPassword } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function disableMemberInternal(actor: Actor, targetUserId: string) {
  const admin = actor.role === 'ADMIN' && !actor.mustChangePassword ? actor : null;
  if (!admin) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Chỉ Ban chủ nhiệm mới có quyền xóa tài khoản thành viên.' };
  }

  const parsedInput = deleteMemberInputSchema.safeParse({ targetUserId });
  if (!parsedInput.success) {
    return { success: false as const, code: 'VALIDATION' as const, error: INVALID_ACTION_INPUT_ERROR };
  }
  targetUserId = parsedInput.data.targetUserId;

  if (admin.id === targetUserId) {
    return { success: false as const, code: 'VALIDATION' as const, error: 'Ban chủ nhiệm không thể tự xóa tài khoản của chính mình.' };
  }

  return prisma.$transaction(async tx => {
    const current = await tx.user.findUnique({
      where: { id: actor.id },
      select: { role: true, status: true, deletedAt: true, mustChangePassword: true },
    });
    if (!current || current.role !== 'ADMIN' || current.status !== 'ACTIVE' || current.deletedAt || current.mustChangePassword) {
      return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
    }
    const targetUser = await tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, fullName: true, role: true, status: true, deletedAt: true },
    });
    if (!targetUser || targetUser.deletedAt || targetUser.status !== 'ACTIVE') {
      return { success: false as const, code: 'VALIDATION' as const, error: 'Không tìm thấy tài khoản thành viên cần xóa.' };
    }
    if (targetUser.role === 'ADMIN') {
      return { success: false as const, code: 'VALIDATION' as const, error: 'Không thể xóa tài khoản Ban chủ nhiệm của hệ thống.' };
    }
    const updated = await tx.user.updateMany({
      where: { id: targetUserId, role: { not: 'ADMIN' }, status: 'ACTIVE', deletedAt: null },
      data: { status: 'SUSPENDED', deletedAt: new Date(), sessionVersion: { increment: 1 } },
    });
    if (updated.count !== 1) return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản vừa thay đổi. Vui lòng tải lại và thử lại.' };
    return { success: true as const, data: { message: `Đã vô hiệu hóa tài khoản "${targetUser.fullName}" thành công.` } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createMember(actor: Actor, input: CreateMemberInput) {
  try { return await createMemberInternal(actor, input); } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản hoặc email đã tồn tại trong hệ thống.' };
    return commandFailure('member.create', error, { actorId: actor.id });
  }
}
export async function disableMember(actor: Actor, targetUserId: string) {
  try { return await disableMemberInternal(actor, targetUserId); } catch (error) { return commandFailure('member.disable', error, { actorId: actor.id }); }
}

import { recoverMemberInputSchema, type RecoverMemberInput } from '../model/member-input';

async function recoverMember(actor: Actor, input: RecoverMemberInput, operation: 'restore' | 'reset') {
  const parsed = recoverMemberInputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: INVALID_ACTION_INPUT_ERROR };
  if (actor.role !== 'ADMIN' || actor.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
  const { targetUserId, expectedVersion } = parsed.data;
  if (operation === 'reset' && targetUserId === actor.id) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Hãy dùng chức năng đổi mật khẩu cho tài khoản của chính bạn.' };
  // Never accept or return an existing credential. Plaintext lives only in this
  // admin response; errors contain no credential or hash metadata.
  const temporaryPassword = operation === 'reset' ? crypto.randomBytes(24).toString('base64url') : undefined;
  const passwordHash = temporaryPassword ? await bcrypt.hash(temporaryPassword, 12) : undefined;
  return prisma.$transaction(async tx => {
    const admin = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, status: true, deletedAt: true, mustChangePassword: true } });
    if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt || admin.mustChangePassword) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Bạn không còn quyền quản trị.' };
    const target = await tx.user.findUnique({ where: { id: targetUserId }, select: { status: true, deletedAt: true, sessionVersion: true } });
    if (!target) return { success: false as const, code: 'NOT_FOUND' as const, error: 'Không tìm thấy tài khoản.' };
    if (target.sessionVersion !== expectedVersion) return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản vừa thay đổi. Vui lòng tải lại trước khi thử lại.' };
    const active = target.status === 'ACTIVE' && !target.deletedAt;
    if ((operation === 'restore' && active) || (operation === 'reset' && !active)) return { success: false as const, code: 'VALIDATION' as const, error: operation === 'reset' ? 'Hãy khôi phục tài khoản trước khi đặt lại mật khẩu.' : 'Tài khoản đã hoạt động.' };
    const changed = await tx.user.updateMany({
      where: { id: targetUserId, sessionVersion: expectedVersion, status: target.status, deletedAt: target.deletedAt },
      data: operation === 'restore'
        ? { status: 'ACTIVE', deletedAt: null, sessionVersion: { increment: 1 } }
        : { passwordHash, mustChangePassword: true, temporaryPasswordConsumed: false, sessionVersion: { increment: 1 } },
    });
    if (changed.count !== 1) return { success: false as const, code: 'CONFLICT' as const, error: 'Tài khoản vừa thay đổi. Vui lòng tải lại trước khi thử lại.' };
    return { success: true as const, data: temporaryPassword ? { temporaryPassword } : {} };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function restoreMember(actor: Actor, input: RecoverMemberInput) {
  try { return await recoverMember(actor, input, 'restore'); } catch (error) { return commandFailure('member.restore', error, { actorId: actor.id }); }
}
export async function resetMemberPassword(actor: Actor, input: RecoverMemberInput) {
  try { return await recoverMember(actor, input, 'reset'); } catch (error) { return commandFailure('member.reset-password', error, { actorId: actor.id }); }
}
