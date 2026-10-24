import { z } from 'zod';
export type BulkPostFilter = 'ALL' | 'PINNED' | 'UNPINNED' | 'PUBLIC' | 'PRIVATE';
export type BulkPostCounts = Record<BulkPostFilter, number>;
export type BulkPostEntry = {
  id: string; title: string; slug: string; isPinned: boolean;
  visibility: 'PUBLIC' | 'PRIVATE'; publishedYear: number | null;
};

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
