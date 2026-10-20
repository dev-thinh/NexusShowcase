import { CustomSelect } from '@/components/ui/custom-select';
import React from 'react';
import type { ItemType } from '@prisma/client';
import type { EditorialOverrides, SubmissionSnapshot } from '@/lib/submission-types';
import { FieldReviewComments, type CommentItem } from './field-review-comments';

interface CategoryOption {
  id: string;
  name: string;
}

interface EditorialFieldsProps {
  snapshot: SubmissionSnapshot;
  overrides: EditorialOverrides;
  categories: CategoryOption[];
  onChangeOverride: <K extends keyof EditorialOverrides>(key: K, value: EditorialOverrides[K]) => void;
  onRestoreField: <K extends keyof EditorialOverrides>(key: K) => void;
  comments: CommentItem[];
  onAddComment?: (
    fieldKey: string,
    body: string,
    audience: 'EDITORIAL' | 'AUTHOR',
    severity: 'REQUIRED' | 'SUGGESTION'
  ) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
  disabled?: boolean;
}

export function EditorialFields({
  snapshot,
  overrides,
  categories,
  onChangeOverride,
  onRestoreField,
  comments,
  onAddComment,
  onResolveComment,
  disabled = false,
}: EditorialFieldsProps) {
  const currentTitle = overrides.title !== undefined ? overrides.title : snapshot.title;
  const currentSummary = overrides.summary !== undefined ? overrides.summary : snapshot.summary;
  const currentContent = overrides.content !== undefined ? overrides.content : snapshot.content;
  const currentCategory = overrides.categoryId !== undefined ? overrides.categoryId : '';
  const currentType = (overrides.type !== undefined ? overrides.type : 'PROJECT') as ItemType;
  const currentYear = overrides.publishedYear !== undefined ? overrides.publishedYear : snapshot.publishedYear;
  const currentIssuer = overrides.issuer !== undefined ? (overrides.issuer ?? '') : '';
  const currentThumbnail = overrides.thumbnailUrl !== undefined ? (overrides.thumbnailUrl ?? '') : '';

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Bản xuất bản biên tập</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu chuẩn hóa sẽ hiển thị ra công chúng khi xuất bản
          </p>
        </div>
      </div>

      <div className="space-y-5 text-sm">
        {/* Category (Chuyên mục) - Required */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="editorial-category"
              className="text-xs font-semibold text-slate-700"
            >
              Chuyên mục <span className="text-red-500">*</span>
            </label>
            {overrides.categoryId !== undefined && !disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRestoreField('categoryId')}
                  className="text-[11px] text-blue-600 hover:text-blue-800"
                >
                  Khôi phục bản gốc
                </button>
              </div>
            )}
          </div>
          <CustomSelect id="editorial-category" value={currentCategory ?? ''} onChange={value => onChangeOverride('categoryId', value || null)} disabled={disabled} required options={[{ value: '', label: 'Chọn chuyên mục phân loại' }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))]} />
          <FieldReviewComments
            fieldKey="categoryId"
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
          />
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="editorial-title"
              className="text-xs font-semibold text-slate-700"
            >
              Tiêu đề công trình
            </label>
            {overrides.title !== undefined && !disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRestoreField('title')}
                  className="text-[11px] text-blue-600 hover:text-blue-800"
                >
                  Khôi phục bản gốc
                </button>
              </div>
            )}
          </div>
          <input
            id="editorial-title"
            type="text"
            value={currentTitle}
            onChange={(e) => onChangeOverride('title', e.target.value)}
            disabled={disabled}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900 font-semibold"
          />
          <FieldReviewComments
            fieldKey="title"
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
          />
        </div>

        {/* Type & Published Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="editorial-type"
                className="text-xs font-semibold text-slate-700"
              >
                Loại nội dung
              </label>
            {overrides.type !== undefined && !disabled && (
                <button type="button" onClick={() => onRestoreField('type')} className="text-[11px] font-semibold text-blue-700 hover:underline">Khôi phục bản gốc</button>
              )}
            </div>
            <CustomSelect id="editorial-type" value={currentType} onChange={value => onChangeOverride('type', value as 'PROJECT' | 'RESEARCH_PAPER')} disabled={disabled} options={[{ value: 'PROJECT', label: 'Robotics & IoT' }, { value: 'RESEARCH_PAPER', label: 'Nghiên cứu khoa học' }]} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="editorial-year"
                className="text-xs font-semibold text-slate-700"
              >
                Năm công bố
              </label>
              {overrides.publishedYear !== undefined && !disabled && (
                <button type="button" onClick={() => onRestoreField('publishedYear')} className="text-[11px] font-semibold text-blue-700 hover:underline">Khôi phục bản gốc</button>
              )}
            </div>
            <input
              id="editorial-year"
              type="number"
              value={currentYear}
              onChange={(e) => onChangeOverride('publishedYear', Number(e.target.value))}
              disabled={disabled}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="editorial-summary"
              className="text-xs font-semibold text-slate-700"
            >
              Mô tả tóm tắt
            </label>
            {overrides.summary !== undefined && !disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRestoreField('summary')}
                  className="text-[11px] text-blue-600 hover:text-blue-800"
                >
                  Khôi phục bản gốc
                </button>
              </div>
            )}
          </div>
          <textarea
            id="editorial-summary"
            rows={3}
            value={currentSummary}
            onChange={(e) => onChangeOverride('summary', e.target.value)}
            disabled={disabled}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900 leading-relaxed"
          />
          <FieldReviewComments
            fieldKey="summary"
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="editorial-content"
              className="text-xs font-semibold text-slate-700"
            >
              Nội dung chi tiết (Markdown)
            </label>
            {overrides.content !== undefined && !disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRestoreField('content')}
                  className="text-[11px] text-blue-600 hover:text-blue-800"
                >
                  Khôi phục bản gốc
                </button>
              </div>
            )}
          </div>
          <textarea
            id="editorial-content"
            rows={6}
            value={currentContent}
            onChange={(e) => onChangeOverride('content', e.target.value)}
            disabled={disabled}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900 leading-relaxed font-mono"
          />
          <FieldReviewComments
            fieldKey="content"
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
          />
        </div>

        {/* Issuer */}
        <div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="editorial-issuer"
                className="text-xs font-semibold text-slate-700"
              >
                Đơn vị / Hội nghị công bố
              </label>
              {overrides.issuer !== undefined && !disabled && (
                <button type="button" onClick={() => onRestoreField('issuer')} className="text-[11px] font-semibold text-blue-700 hover:underline">Khôi phục bản gốc</button>
              )}
            </div>
            <input
              id="editorial-issuer"
              type="text"
              value={currentIssuer}
              onChange={(e) => onChangeOverride('issuer', e.target.value || null)}
              placeholder="VD: IEEE, HCMUS, Khoa CNTT"
              disabled={disabled}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Thumbnail URL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="editorial-thumbnail"
              className="text-xs font-semibold text-slate-700"
            >
              Ảnh đại diện (Thumbnail URL)
            </label>
            {overrides.thumbnailUrl !== undefined && !disabled && (
              <button type="button" onClick={() => onRestoreField('thumbnailUrl')} className="text-[11px] font-semibold text-blue-700 hover:underline">Khôi phục bản gốc</button>
            )}
          </div>
          <input
            id="editorial-thumbnail"
            type="text"
            value={currentThumbnail}
            onChange={(e) => onChangeOverride('thumbnailUrl', e.target.value || null)}
            placeholder="/uploads/thumbnails/... hoặc https://..."
            disabled={disabled}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900"
          />
        </div>
      </div>
    </div>
  );
}
