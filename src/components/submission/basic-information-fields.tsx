'use client';

import type { ShowcaseDraftInput } from '@/lib/action-schemas';
import { ReviewComments, reviewCommentId, type AuthorReviewComment } from './review-comments';

interface BasicInformationFieldsProps {
  value: ShowcaseDraftInput;
  errors: Record<string, string[]>;
  onChange: <K extends keyof ShowcaseDraftInput>(field: K, value: ShowcaseDraftInput[K]) => void;
  reviewComments?: AuthorReviewComment[];
}

const inputClass = 'mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/15';

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return <p id={id} className="mt-1.5 text-sm text-rose-700">{errors[0]}</p>;
}

export function BasicInformationFields({ value, errors, onChange, reviewComments = [] }: BasicInformationFieldsProps) {
  const commentDescriptionId = (field: string) => reviewComments.some((comment) => comment.audience === 'AUTHOR' && comment.fieldKey === field) ? reviewCommentId(field) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="submission-title" className="block text-sm font-semibold text-slate-900">Tiêu đề</label>
        <p className="mt-1 text-sm text-slate-600">Tên ngắn gọn, chính xác của công trình hoặc dự án.</p>
        <input id="submission-title" value={value.title} onChange={(event) => onChange('title', event.target.value)} aria-describedby={[errors.title?.length ? 'submission-title-error' : '', commentDescriptionId('title')].filter(Boolean).join(' ') || undefined} aria-invalid={Boolean(errors.title?.length)} className={inputClass} />
        <FieldError id="submission-title-error" errors={errors.title} />
        <ReviewComments comments={reviewComments} fieldKey="title" />
      </div>
      <div>
        <label htmlFor="submission-summary" className="block text-sm font-semibold text-slate-900">Tóm tắt</label>
        <p className="mt-1 text-sm text-slate-600">Trình bày vấn đề, cách tiếp cận và đóng góp chính. Có thể bổ sung trước khi gửi duyệt.</p>
        <textarea id="submission-summary" rows={5} value={value.summary} onChange={(event) => onChange('summary', event.target.value)} aria-describedby={[errors.summary?.length ? 'submission-summary-error' : '', commentDescriptionId('summary')].filter(Boolean).join(' ') || undefined} aria-invalid={Boolean(errors.summary?.length)} className={inputClass} />
        <FieldError id="submission-summary-error" errors={errors.summary} />
        <ReviewComments comments={reviewComments} fieldKey="summary" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="submission-field" className="block text-sm font-semibold text-slate-900">Gợi ý lĩnh vực</label>
          <input id="submission-field" value={value.suggestedField} onChange={(event) => onChange('suggestedField', event.target.value)} className={inputClass} placeholder="Ví dụ: Robotics, IoT, thị giác máy tính" />
        </div>
        <div>
          <label htmlFor="submission-year" className="block text-sm font-semibold text-slate-900">Năm thực hiện</label>
          <input id="submission-year" type="number" min={1900} max={new Date().getFullYear() + 1} value={value.publishedYear ?? ''} onChange={(event) => onChange('publishedYear', event.target.value ? Number(event.target.value) : undefined)} className={inputClass} />
        </div>
      </div>
      {(value.suggestedField ?? '').trim().toLocaleLowerCase('vi') === 'khác' && (
        <div>
          <label htmlFor="submission-custom-type" className="block text-sm font-semibold text-slate-900">Mô tả thể loại khác</label>
          <input id="submission-custom-type" value={value.customProjectType} onChange={(event) => onChange('customProjectType', event.target.value)} className={inputClass} />
        </div>
      )}
    </div>
  );
}
