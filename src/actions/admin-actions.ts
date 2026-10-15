'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { Role } from '@prisma/client';
import {
  createMemberInputSchema,
  deleteMemberInputSchema,
  INVALID_ACTION_INPUT_ERROR,
  userRoleUpdateInputSchema,
  type CreateMemberInput,
} from '@/lib/action-schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type { CreateMemberInput };

function toSafeMember(user: { id: string; fullName: string; role: Role; status: string }) {
  return { id: user.id, fullName: user.fullName, role: user.role, status: user.status };
}

export async function createMemberAction(input: CreateMemberInput) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản thành viên.' };
  }

  const parsedInput = createMemberInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  input = parsedInput.data;

  if (!input.fullName?.trim()) {
    return { success: false, error: 'Vui lòng nhập họ và tên của thành viên.' };
  }

  if (!input.email?.trim()) {
    return { success: false, error: 'Vui lòng nhập email hoặc tên đăng nhập của thành viên.' };
  }

  const emailTrimmed = input.email.trim();
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailTrimmed },
        { email: emailTrimmed.toLowerCase() },
      ],
    },
  });

  if (existing) {
    return { success: false, error: `Tài khoản hoặc email "${emailTrimmed}" đã tồn tại trong hệ thống.` };
  }

  const rawPassword = input.password?.trim() || crypto.randomBytes(12).toString('base64url');
  if (rawPassword.length < 6) {
    return { success: false, error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' };
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const newUser = await prisma.user.create({
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

  return { success: true, user: toSafeMember(newUser), temporaryPassword: rawPassword };
}

export async function updateUserRoleAction(targetUserId: string, newRole: Role) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền phân quyền thành viên.' };
  }

  const parsedInput = userRoleUpdateInputSchema.safeParse({ targetUserId, newRole });
  if (!parsedInput.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  targetUserId = parsedInput.data.targetUserId;
  newRole = parsedInput.data.newRole;

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: newRole,
      sessionVersion: { increment: 1 },
    },
    select: { id: true, fullName: true, role: true, status: true },
  });

  return { success: true, user: toSafeMember(updatedUser) };
}

export async function deleteMemberAction(targetUserId: string) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền xóa tài khoản thành viên.' };
  }

  const parsedInput = deleteMemberInputSchema.safeParse({ targetUserId });
  if (!parsedInput.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  targetUserId = parsedInput.data.targetUserId;

  if (admin.id === targetUserId) {
    return { success: false, error: 'Quản trị viên không thể tự xóa tài khoản của chính mình.' };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return { success: false, error: 'Không tìm thấy tài khoản thành viên cần xóa.' };
  }

  if (targetUser.role === 'ADMIN') {
    return { success: false, error: 'Không thể xóa tài khoản Quản trị viên của hệ thống.' };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status: 'SUSPENDED',
      deletedAt: new Date(),
      sessionVersion: { increment: 1 },
    },
  });

  return {
    success: true,
    message: `Đã vô hiệu hóa tài khoản "${targetUser.fullName}" thành công.`,
  };
}
