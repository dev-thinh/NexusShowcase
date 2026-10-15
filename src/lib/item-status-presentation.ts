import type { ItemStatus } from '@prisma/client';

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ biên tập',
  REVISION_REQUESTED: 'Chờ tác giả bổ sung',
  READY_FOR_APPROVAL: 'Chờ phê duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Không được phê duyệt',
  ARCHIVED: 'Đã lưu trữ',
};

export function getItemStatusLabel(status: ItemStatus): string {
  return ITEM_STATUS_LABELS[status];
}
