'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db/prisma';
import { commandFailure } from '@/server/db/command-error';
import { profileInputSchema, type ProfileInput } from '../model/profile-input';
import { getActor } from './actor';

export async function updateProfileAction(input: ProfileInput) {
  const actor = await getActor();
  if (!actor) return { success: false as const, code: 'UNAUTHORIZED' as const, error: 'Vui lòng đăng nhập để chỉnh sửa hồ sơ.' };
  const parsed = profileInputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, code: 'VALIDATION' as const, error: 'Vui lòng kiểm tra họ tên, giới thiệu (tối đa 2000 ký tự) và các liên kết HTTP(S).' };
  try {
    const profile = parsed.data;
    const data = {
      fullName: profile.fullName,
      bio: profile.bio || null,
      profileLinks: profile.links,
      githubUrl: null,
      linkedinUrl: null,
      googleScholarUrl: null,
      portfolioUrl: null,
    };
    const updated = await prisma.user.updateMany({
      where: { id: actor.id, status: 'ACTIVE', deletedAt: null, mustChangePassword: false },
      data,
    });
    if (updated.count !== 1) return { success: false as const, code: 'FORBIDDEN' as const, error: 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.' };
    revalidatePath(`/members/${actor.id}`);
    revalidatePath('/members');
    revalidatePath('/members/all');
    revalidatePath('/', 'layout');
    return { success: true as const };
  } catch (error) {
    return commandFailure('member.profile', error, { actorId: actor.id });
  }
}
