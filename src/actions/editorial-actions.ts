'use server';

import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { cuidSchema } from '@/lib/action-schemas';
import { revalidatePath } from 'next/cache';

type RetiredResult = { success: true; data: { id: string }; error?: never } | { success: false; error: string; data?: never };

export async function assignEditorAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function saveEditorialDraftAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function addReviewCommentAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function resolveReviewCommentAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function markReadyForApprovalAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function returnToEditorAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function publishEditorialDraftAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function requestAuthorRevisionAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

export async function rejectShowcaseAction(..._args: unknown[]): Promise<RetiredResult> {
  return { success: false, error: 'Luồng biên tập đã ngừng sử dụng. Vui lòng dùng trang phê duyệt trực tiếp của Admin.' };
}

// Administrative lifecycle operations remain available independently of the retired editor role.
async function adminLifecycle(itemId: string, action: 'REOPEN' | 'ARCHIVE') {
  const actor = await getCurrentUser(['ADMIN']);
  if (!actor) return { success: false, error: 'Chỉ Admin có quyền thực hiện thao tác này.' };
  if (!cuidSchema.safeParse(itemId).success) return { success: false, error: 'Mã bài không hợp lệ.' };
  const item = await prisma.showcaseItem.findUnique({ where: { id: itemId } });
  const allowed = action === 'REOPEN' ? ['REJECTED'] : ['PUBLISHED', 'REJECTED'];
  if (!item || !allowed.includes(item.status)) return { success: false, error: 'Trạng thái hiện tại không cho phép thao tác này.' };
  const result = await prisma.$transaction(async tx => {
    const status = action === 'REOPEN' ? 'DRAFT' as const : 'ARCHIVED' as const;
    const changed = await tx.showcaseItem.updateMany({ where: { id: item.id, reviewVersion: item.reviewVersion, status: item.status }, data: {
      status, reviewStatus: null, reviewVersion: { increment: 1 },
      ...(action === 'REOPEN' ? { rejectionReason: null } : { isPinned: false, pinnedAt: null }),
    } });
    if (!changed.count) return { success: false, error: 'Bài đã thay đổi. Vui lòng tải lại trang.' };
    await tx.auditEvent.create({ data: { itemId, actorId: actor.id, action: action === 'REOPEN' ? 'REOPENED' : 'ARCHIVED' } });
    return { success: true, data: { status } };
  });
  if (result.success) { try { for (const path of ['/', '/dashboard', '/admin', '/admin/reviews', `/showcase/${item.slug}`]) revalidatePath(path); } catch {} }
  return result;
}
export async function reopenShowcaseAction(itemId: string) { return adminLifecycle(itemId, 'REOPEN'); }
export async function archiveShowcaseAction(itemId: string) { return adminLifecycle(itemId, 'ARCHIVE'); }
