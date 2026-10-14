import React, { useState } from 'react';

export interface CommentItem {
  id: string;
  fieldKey: string;
  body: string;
  audience: 'EDITORIAL' | 'AUTHOR';
  severity: 'REQUIRED' | 'SUGGESTION';
  status: 'OPEN' | 'RESOLVED';
  author?: { fullName: string | null; email: string };
  createdAt: Date | string;
}

interface FieldReviewCommentsProps {
  fieldKey: string;
  comments: CommentItem[];
  onAddComment?: (
    fieldKey: string,
    body: string,
    audience: 'EDITORIAL' | 'AUTHOR',
    severity: 'REQUIRED' | 'SUGGESTION'
  ) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
}

export function FieldReviewComments({
  fieldKey,
  comments,
  onAddComment,
  onResolveComment,
}: FieldReviewCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'EDITORIAL' | 'AUTHOR'>('EDITORIAL');
  const [severity, setSeverity] = useState<'REQUIRED' | 'SUGGESTION'>('REQUIRED');
  const [loading, setLoading] = useState(false);

  const fieldComments = comments.filter((c) => c.fieldKey === fieldKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !onAddComment) return;
    setLoading(true);
    try {
      await onAddComment(fieldKey, body.trim(), audience, severity);
      setBody('');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1 space-y-2">
      {fieldComments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {fieldComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-2 rounded text-xs border ${
                comment.status === 'RESOLVED'
                  ? 'bg-slate-50 border-slate-200 text-slate-500 line-through'
                  : comment.audience === 'AUTHOR'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-medium text-[11px]">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      comment.audience === 'AUTHOR'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-blue-200 text-blue-900'
                    }`}
                  >
                    {comment.audience === 'AUTHOR' ? 'Tác giả' : 'Nội bộ'}
                  </span>
                  <span className="text-slate-600">
                    {comment.severity === 'REQUIRED' ? 'Bắt buộc' : 'Gợi ý'}
                  </span>
                  {comment.author?.fullName && (
                    <span className="text-slate-400 font-normal">
                      · {comment.author.fullName}
                    </span>
                  )}
                </div>
                {comment.status === 'OPEN' && onResolveComment && (
                  <button
                    type="button"
                    onClick={() => onResolveComment(comment.id)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 underline"
                  >
                    Đã xử lý
                  </button>
                )}
              </div>
              <p className="text-xs">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {onAddComment && (
        <div>
          {!isOpen ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              + Thêm phản hồi trường này
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-2 mt-2 text-xs">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Nhập nội dung phản hồi..."
                rows={2}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-slate-900"
                required
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                  >
                    <option value="EDITORIAL">Nội bộ (Editor / Admin)</option>
                    <option value="AUTHOR">Gửi tác giả (Author)</option>
                  </select>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                  >
                    <option value="REQUIRED">Bắt buộc</option>
                    <option value="SUGGESTION">Gợi ý</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-2 py-1 text-slate-600 hover:text-slate-900"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !body.trim()}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Lưu phản hồi
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
