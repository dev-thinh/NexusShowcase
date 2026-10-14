export interface AuthorReviewComment {
  id: string;
  fieldKey: string;
  body: string;
  audience: 'AUTHOR' | 'EDITORIAL';
  severity: 'REQUIRED' | 'SUGGESTION';
}

export function reviewCommentId(fieldKey: string) {
  return `review-comment-${fieldKey}`;
}

export function ReviewComments({ comments, fieldKey }: { comments: AuthorReviewComment[]; fieldKey: string }) {
  const visible = comments.filter((comment) => comment.audience === 'AUTHOR' && comment.fieldKey === fieldKey);
  if (!visible.length) return null;
  return (
    <div id={reviewCommentId(fieldKey)} className="mt-2 border-l-2 border-amber-500 pl-3 text-sm text-slate-700">
      {comments.map((comment) => {
        if (comment.audience !== 'AUTHOR' || comment.fieldKey !== fieldKey) return null;
        return <p key={comment.id}>{comment.body}</p>;
      })}
    </div>
  );
}
