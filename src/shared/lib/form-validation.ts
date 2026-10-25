import { z } from 'zod';

export function formErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_form';
    let message = issue.message;
    if (/^(Invalid|Too |Only HTTP)/.test(message)) {
      if (issue.code === 'too_small') message = 'Vui lòng điền đầy đủ thông tin hợp lệ.';
      else if (issue.code === 'too_big') message = `Nội dung vượt quá giới hạn ${issue.maximum} ký tự hoặc mục.`;
      else if ((issue.code === 'invalid_format' && issue.format === 'url') || /Only HTTP/.test(message)) message = 'Vui lòng nhập liên kết HTTP(S) hợp lệ.';
      else message = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
    }
    errors[path] ??= message;
  }
  return errors;
}

export const searchFormSchema = z.object({
  q: z.string().trim().max(200, 'Từ khóa tìm kiếm không được vượt quá 200 ký tự.').optional(),
  year: z.union([z.literal(''), z.string().regex(/^\d{4}$/, 'Năm phải có 4 chữ số.').refine(value => Number(value) >= 1900 && Number(value) <= 2100, 'Năm phải từ 1900 đến 2100.')]).optional(),
  sort: z.enum(['featured', 'newest', 'oldest', 'title'], { error: 'Vui lòng chọn cách sắp xếp hợp lệ.' }).optional(),
  role: z.enum(['ALL', 'ADMIN', 'CORE_MEMBER', 'MEMBER', 'EDITOR', 'GUEST'], { error: 'Vui lòng chọn vai trò hợp lệ.' }).optional(),
  filter: z.enum(['ALL', 'PINNED', 'UNPINNED', 'PUBLIC', 'PRIVATE', 'DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'PUBLISHED', 'REJECTED'], { error: 'Vui lòng chọn bộ lọc hợp lệ.' }).optional(),
});
