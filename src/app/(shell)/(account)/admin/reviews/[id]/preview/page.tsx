import { getActor } from '@/features/identity/server/actor';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getReviewSnapshot } from '@/features/review/server/review-snapshot';
import { SubmissionPreview } from '@/features/submissions/components/submission-preview';
import { prisma } from '@/server/db/prisma';
import { notFound, redirect } from 'next/navigation';

export default async function ReviewPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getActor(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const { id } = await params;
  const item = await prisma.showcaseItem.findUnique({ where: { id }, include: {
    contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
    revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
  } });
  if (!item) notFound();
  return <section className="bg-white p-4 sm:p-6"><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: 'Phê duyệt', href: '/admin/reviews' }, { label: item.title, href: `/admin/reviews/${item.id}` }, { label: 'Xem trước' }]} /><p className="mb-4 text-sm font-semibold text-[#1F2937]">Bản xem trước · Chưa xuất bản</p><SubmissionPreview snapshot={getReviewSnapshot(item)} /></div></section>;
}
