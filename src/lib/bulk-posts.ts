import { z } from 'zod';

export const BULK_POST_ACTIONS = [
  { value: 'PIN', label: 'Ghim trang chủ' },
  { value: 'UNPIN', label: 'Bỏ ghim' },
  { value: 'PUBLIC', label: 'Chuyển công khai' },
  { value: 'PRIVATE', label: 'Chuyển nội bộ' },
] as const;
export type BulkPostAction = typeof BULK_POST_ACTIONS[number]['value'];
export type BulkPostFilter = 'ALL' | 'PINNED' | 'UNPINNED' | 'PUBLIC' | 'PRIVATE';
export type BulkPostCounts = Record<BulkPostFilter, number>;
export type BulkPostEntry = {
  id: string; title: string; slug: string; isPinned: boolean;
  visibility: 'PUBLIC' | 'PRIVATE'; publishedYear: number | null;
};
export const bulkPostInputSchema = z.object({
  itemIds: z.array(z.string().cuid()).min(1).max(50).transform(ids => [...new Set(ids)]),
  action: z.enum(['PIN', 'UNPIN', 'PUBLIC', 'PRIVATE']),
  replaceItemIds: z.array(z.string().cuid()).max(50).default([]).transform(ids => [...new Set(ids)]),
}).strict().superRefine((value, context) => {
  if (value.replaceItemIds.length && value.action !== 'PIN') {
    context.addIssue({ code: 'custom', path: ['replaceItemIds'], message: 'Chỉ chọn bài thay thế khi ghim.' });
  }
  if (value.replaceItemIds.some(id => value.itemIds.includes(id))) {
    context.addIssue({ code: 'custom', path: ['replaceItemIds'], message: 'Bài thay thế không được trùng với bài đã chọn.' });
  }
});

export const bulkPostStateSchema = z.object({
  mode: z.enum(['pin', 'visibility']),
  changes: z.array(z.object({ itemId: z.string().cuid(), enabled: z.boolean() }).strict()).min(1).max(50),
  replaceItemIds: z.array(z.string().cuid()).max(50).default([]).transform(ids => [...new Set(ids)]),
}).strict().superRefine((value, context) => {
  const ids = value.changes.map(change => change.itemId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['changes'], message: 'Mỗi bài chỉ được có một trạng thái.' });
  if (value.replaceItemIds.length && (value.mode !== 'pin' || !value.changes.some(change => change.enabled))) context.addIssue({ code: 'custom', path: ['replaceItemIds'], message: 'Chỉ thay thế khi ghim bài mới.' });
  if (value.replaceItemIds.some(id => ids.includes(id))) context.addIssue({ code: 'custom', path: ['replaceItemIds'], message: 'Bài thay thế không được trùng với bài đã sửa.' });
});
