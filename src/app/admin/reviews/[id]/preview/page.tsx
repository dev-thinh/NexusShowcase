import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { getReviewSnapshot } from '@/lib/direct-review';
import { SubmissionPreview } from '@/components/submission-preview';

export default async function ReviewPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentUser(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const { id } = await params;
  const item = await prisma.showcaseItem.findUnique({ where: { id }, include: {
    contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
    revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
  } });
  if (!item) notFound();
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-4xl"><p className="mb-4 text-sm font-semibold text-slate-600">Bản xem trước · Chưa xuất bản</p><SubmissionPreview snapshot={getReviewSnapshot(item)} /></div></main>;
}
