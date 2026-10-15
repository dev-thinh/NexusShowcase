import React, { useState } from 'react';
import type { SubmissionResource, SubmissionSnapshot } from '@/lib/submission-types';
import { formatResourceMetadata } from '@/lib/resource-presentation';
import { ResourcePreviewModal } from './resource-preview-modal';
import { FieldReviewComments, type CommentItem } from './field-review-comments';

interface SourceRevisionViewProps {
  snapshot: SubmissionSnapshot;
  revisions?: Array<{
    id: string;
    revisionNumber: number;
    submittedAt: Date | string;
  }>;
  selectedRevisionNumber?: number;
  onSelectRevision?: (revNum: number) => void;
  memberNamesById?: Record<string, string>;
  comments?: CommentItem[];
  onAddComment?: (fieldKey: string, body: string, audience: 'EDITORIAL' | 'AUTHOR', severity: 'REQUIRED' | 'SUGGESTION') => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
}

export function SourceRevisionView({
  snapshot,
  revisions = [],
  selectedRevisionNumber = 1,
  onSelectRevision,
  memberNamesById = {},
  comments = [],
  onAddComment,
  onResolveComment,
}: SourceRevisionViewProps) {
  const [previewResource, setPreviewResource] = useState<SubmissionResource | null>(null);
  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Bản gốc tác giả</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Snapshot bất biến do tác giả nộp
          </p>
        </div>
        {revisions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Lần nộp:</span>
            <select
              value={selectedRevisionNumber}
              onChange={(e) => onSelectRevision?.(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
            >
              {revisions.map((rev) => (
                <option key={rev.id} value={rev.revisionNumber}>
                  Lần {rev.revisionNumber} ({new Date(rev.submittedAt).toLocaleDateString('vi-VN')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">Tiêu đề công trình</span>
          <p className="font-medium text-slate-900">{snapshot.title || 'Chưa có tiêu đề'}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">Gợi ý lĩnh vực</span>
          <p className="text-slate-700">
            {snapshot.suggestedField || snapshot.customProjectType || 'Chưa có gợi ý'}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">Tóm tắt</span>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {snapshot.summary || 'Chưa có tóm tắt'}
          </p>
        </div>

        {snapshot.content && (
          <div>
            <span className="text-xs font-medium text-slate-500 block mb-1">Nội dung chi tiết</span>
            <div className="panel-nested text-slate-700 whitespace-pre-line leading-relaxed text-xs">
              {snapshot.content}
            </div>
          </div>
        )}

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-2">Tác giả và người tham gia</span>
          {snapshot.contributors.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không có danh sách tác giả</p>
          ) : (
            <ul className="panel-nested divide-y divide-slate-100 !p-0 text-xs bg-slate-50/50">
              {snapshot.contributors.map((contrib, idx) => (
                <li key={idx} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">
                      {contrib.externalName ?? contrib.displayName ?? memberNamesById[contrib.userId ?? ''] ?? 'Thành viên'}
                    </span>
                    {contrib.externalAffiliation && (
                      <span className="text-slate-500 block text-[11px]">
                        {contrib.externalAffiliation}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-700">
                    {contrib.customRoleTitle || contrib.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-2">Tài nguyên đính kèm</span>
          {snapshot.resources.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không có tài nguyên</p>
          ) : (
            <ul className="panel-nested divide-y divide-slate-100 !p-0 text-xs">
              {snapshot.resources.map((res, idx) => {
                const metadata = formatResourceMetadata(res);
                return (
                <li key={idx} className="p-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-slate-900">{metadata.primary}</span>
                    <span className="text-slate-500 block text-[11px]">{metadata.secondary}</span>
                  </div>
                  <button type="button" onClick={() => setPreviewResource(res)} className="action-secondary-detail shrink-0" aria-label={`Xem tài nguyên ${res.label}`}>
                    Xem tài nguyên
                  </button>
                </li>
              )})}
            </ul>
          )}
          <FieldReviewComments
            fieldKey="resources"
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
          />
        </div>
      </div>
      <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
    </div>
  );
}
