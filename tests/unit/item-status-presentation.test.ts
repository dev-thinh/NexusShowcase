import { ItemStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { getItemStatusLabel, ITEM_STATUS_LABELS } from '@/lib/item-status-presentation';

describe('item status presentation', () => {
  it('provides a localized label for every workflow status', () => {
    expect(ITEM_STATUS_LABELS).toEqual({
      DRAFT: 'Bản nháp',
      PENDING_REVIEW: 'Chờ biên tập',
      REVISION_REQUESTED: 'Chờ tác giả bổ sung',
      READY_FOR_APPROVAL: 'Chờ phê duyệt',
      PUBLISHED: 'Đã xuất bản',
      REJECTED: 'Không được phê duyệt',
      ARCHIVED: 'Đã lưu trữ',
    });
  });

  it('returns the shared Vietnamese label', () => {
    expect(getItemStatusLabel(ItemStatus.PENDING_REVIEW)).toBe('Chờ biên tập');
    expect(getItemStatusLabel(ItemStatus.REVISION_REQUESTED)).toBe('Chờ tác giả bổ sung');
    expect(getItemStatusLabel(ItemStatus.REJECTED)).toBe('Không được phê duyệt');
    expect(getItemStatusLabel(ItemStatus.READY_FOR_APPROVAL)).toBe('Chờ phê duyệt');
  });
});
