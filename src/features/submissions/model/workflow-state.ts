export function canReviewItem(item: { status: string; reviewStatus?: string | null }) {
  return ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.status) || item.status === 'PUBLISHED' && ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.reviewStatus ?? '');
}
