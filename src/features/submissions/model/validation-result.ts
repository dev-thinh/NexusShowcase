import { formErrors } from '@/shared/lib/form-validation';
import type { ActionResult } from '@/shared/lib/action-result';
import type { ZodError } from 'zod';

export function submissionValidationMessage(error: ZodError): string {
  const labels: Record<string, string> = { conference: 'Thông tin hội nghị / tạp chí', title: 'Tiêu đề', summary: 'Tóm tắt', content: 'Nội dung', contributors: 'Người đóng góp', resources: 'Tài nguyên', categoryId: 'Chuyên mục', thumbnailUrl: 'Ảnh đại diện', publishedYear: 'Năm thực hiện' };
  const messages = Object.entries(formErrors(error)).map(([path, message]) => {
    const [field, index] = path.split('.');
    return `${labels[field] || field}${/^\d+$/.test(index ?? '') ? ` ${Number(index) + 1}` : ''}: ${message}`;
  });
  return [...new Set(messages)].join(' ') || 'Vui lòng kiểm tra lại thông tin bài viết.';
}

export function submissionFieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const [path, message] of Object.entries(formErrors(error))) {
    let target = path;
    if (/^content\.sections\.\d+\.blocks\.\d+\.(fileName|fileSize|mimeType)$/.test(path)) target = path.replace(/[^.]+$/, 'url');
    if (/^content\.sections\.\d+\.blocks\.\d+\.alt$/.test(path)) target = path.replace(/alt$/, 'caption');
    if (/^resources\.\d+\.(fileName|fileSize|mimeType)$/.test(path)) target = path.replace(/[^.]+$/, 'url');
    if (/^contributors\.\d+\.(userId|externalAffiliation|externalLink|displayOrder)$/.test(path)) target = path.split('.').slice(0, 2).join('.');
    (fields[target] ??= []).push(message);
  }
  return fields;
}

export function validationFailure(error: ZodError): ActionResult<never> {
  return { success: false, code: 'VALIDATION', error: submissionValidationMessage(error), fieldErrors: submissionFieldErrors(error) };
}
