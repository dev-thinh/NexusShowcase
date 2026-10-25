'use server';

import { getActor } from '@/features/identity/server/actor';
import { commandFailure } from '@/server/db/command-error';
import type { UploadResult } from '../model/contracts';
import { uploadAsset } from './upload-command';
import { prisma } from '@/server/db/prisma';
import { revalidatePath } from 'next/cache';

function refreshAvatar(id: string) {
  revalidatePath(`/members/${id}`);
  revalidatePath('/members');
  revalidatePath('/members/all');
  revalidatePath('/', 'layout');
}

export async function uploadAvatarAction(formData: FormData): Promise<UploadResult> {
  const actor = await getActor();
  if (!actor) return { success: false, code: 'UNAUTHORIZED', error: 'Vui lòng đăng nhập để đổi ảnh đại diện.' };
  if (!(formData instanceof FormData)) return { success: false, code: 'VALIDATION', error: 'Dữ liệu ảnh không hợp lệ.' };
  const file = formData.get('file');
  if (!(file instanceof File)) return { success: false, code: 'VALIDATION', error: 'Vui lòng chọn ảnh đại diện.' };
  try {
    const uploaded = await uploadAsset(file, 'thumbnail', actor.id);
    if (!uploaded.success) return uploaded;
    const updated = await prisma.user.updateMany({ where: { id: actor.id, status: 'ACTIVE', deletedAt: null, mustChangePassword: false }, data: { avatarUrl: uploaded.data.url } });
    if (updated.count !== 1) return { success: false, code: 'FORBIDDEN', error: 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.' };
    refreshAvatar(actor.id);
    return uploaded;
  }
  catch (error) { return commandFailure('member.avatar', error, { actorId: actor.id }); }
}

export async function removeAvatarAction() {
  const actor = await getActor();
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Vui lòng đăng nhập để xóa ảnh đại diện.' };
  try {
    const updated = await prisma.user.updateMany({ where: { id: actor.id, status: 'ACTIVE', deletedAt: null, mustChangePassword: false }, data: { avatarUrl: null } });
    if (updated.count !== 1) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.' };
    refreshAvatar(actor.id);
    return { success: true as const };
  } catch (error) { return commandFailure('member.avatar.remove', error, { actorId: actor.id }); }
}
