import { canReviewItem } from '@/features/submissions/model/workflow-state';
import type { ItemStatus } from '@prisma/client';

export const postFilters = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { value: 'REVISION_REQUESTED', label: 'Cần chỉnh sửa' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'REJECTED', label: 'Từ chối' },
] as const;
export type PostFilter = typeof postFilters[number]['value'];
type FilterablePost = { title: string; summary: string; status: ItemStatus; reviewStatus?: ItemStatus | null };
export function matchesPostFilter(item: FilterablePost, filter: PostFilter, query = '') {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
  if (!normalize(`${item.title} ${item.summary}`).includes(normalize(query.trim()))) return false;
  if (filter === 'ALL') return true;
  if (filter === 'PENDING_REVIEW') return canReviewItem(item);
  if (filter === 'REVISION_REQUESTED' || filter === 'REJECTED') return item.status === filter || item.reviewStatus === filter;
  return item.status === filter;
}
