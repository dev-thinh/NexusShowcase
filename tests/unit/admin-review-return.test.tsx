import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import ReviewDetailPage from '@/app/(shell)/(account)/admin/reviews/[id]/page';
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => ({ id: 'admin', role: 'ADMIN' }) }));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: { findUnique: async () => ({ id: 'submission', title: 'Robot', status: 'PENDING_REVIEW', reviewVersion: 1 }) } } }));
vi.mock('@/features/review/server/review-snapshot', () => ({ getReviewSnapshot: () => ({}) }));
vi.mock('@/features/submissions/model/workflow-state', () => ({ canReviewItem: () => true }));
vi.mock('@/features/submissions/components/submission-preview', () => ({ SubmissionPreview: () => <article>Bản nộp</article> }));
vi.mock('@/features/review/components/approval-controls', () => ({ ApprovalControls: ({ returnTo }: { returnTo: string }) => <span data-review-return={returnTo} /> }));
it('returns to the filtered queue and keeps review details inside the shared workspace', async () => {
  const html = renderToStaticMarkup(await ReviewDetailPage({ params: Promise.resolve({ id: 'submission' }), searchParams: Promise.resolve({ returnTo: '/admin/reviews?q=robot&page=2' }) }));
  expect(html).toContain('href="/admin/reviews?q=robot&amp;page=2"');
  expect(html).toContain('data-review-return="/admin/reviews?q=robot&amp;page=2"');
  expect(html).toContain('Quay lại danh sách');
  expect(html).not.toContain('<main');
});
it('does not accept an external review return destination', async () => {
  const html = renderToStaticMarkup(await ReviewDetailPage({ params: Promise.resolve({ id: 'submission' }), searchParams: Promise.resolve({ returnTo: 'https://example.com' }) }));
  expect(html).toContain('data-review-return="/admin/reviews"');
  expect(html).not.toContain('example.com');
});
