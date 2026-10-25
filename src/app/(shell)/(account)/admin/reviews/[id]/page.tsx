import { getActor } from '@/features/identity/server/actor';
import { ApprovalControls } from '@/features/review/components/approval-controls';
import { getReviewSnapshot } from '@/features/review/server/review-snapshot';
import { SubmissionPreview } from '@/features/submissions/components/submission-preview';
import { canReviewItem } from '@/features/submissions/model/workflow-state';
import { prisma } from '@/server/db/prisma';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { notFound, redirect } from 'next/navigation';

export default async function ReviewDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ returnTo?: string }> }) {
  if (!await getActor(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const { id } = await params;
  const requested = (await searchParams)?.returnTo;
  const returnTo = requested?.startsWith('/admin/reviews?') && requested.length <= 2048 ? requested : '/admin/reviews';
  const item = await prisma.showcaseItem.findUnique({ where: { id }, include: {
    contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
    revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
  } });
  if (!item) notFound();
  return <section className="pb-20 lg:pb-0" aria-label="Chi tiết phê duyệt">
    <Link href={returnTo} scroll={false} className="action-secondary-detail">Quay lại danh sách</Link>
    <Link href={`/admin/reviews/${encodeURIComponent(item.id)}/preview`} target="_blank" rel="noopener noreferrer" className="action-secondary-detail fixed bottom-4 right-4 z-30 min-h-11 bg-white shadow-lg lg:hidden">Xem trước</Link>
    {item.status === 'PUBLISHED' && <p className="mt-5 rounded-lg border border-slate-200 bg-[#FFFFFF] p-4 text-sm text-[#1F2937]">Bạn đang xem bản cập nhật được gửi duyệt. Bài đã xuất bản vẫn giữ nội dung cũ đến khi bản này được duyệt.</p>}
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><SubmissionPreview snapshot={getReviewSnapshot(item)} />{canReviewItem(item) ? <ApprovalControls itemId={item.id} reviewVersion={item.reviewVersion} returnTo={returnTo} /> : <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-[#1F2937]">Bài không còn ở trạng thái chờ duyệt.</p>}</div>
  </section>;
}
