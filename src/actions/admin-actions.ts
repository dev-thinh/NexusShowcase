'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface CreateMemberInput {
  fullName: string;
  email: string;
  studentId?: string;
  role?: 'MEMBER' | 'CORE_MEMBER';
  password?: string;
}

export async function createMemberAction(input: CreateMemberInput) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản thành viên.' };
  }

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

  const rawPassword = input.password?.trim() || 'member123';
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
    },
  });

  return { success: true, user: newUser };
}

export async function updateUserRoleAction(targetUserId: string, newRole: Role) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền phân quyền thành viên.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  return { success: true, user: updatedUser };
}

export async function deleteMemberAction(targetUserId: string) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền xóa tài khoản thành viên.' };
  }

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

  await prisma.user.delete({
    where: { id: targetUserId },
  });

  return {
    success: true,
    message: `Đã xóa tài khoản "${targetUser.fullName}" thành công.`,
  };
}
