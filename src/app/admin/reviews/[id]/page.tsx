import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { canReviewItem, getReviewSnapshot } from '@/lib/direct-review';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { SubmissionPreview } from '@/components/submission-preview';
import { ApprovalControls } from '@/components/approval-controls';

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentUser(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const { id } = await params;
  const item = await prisma.showcaseItem.findUnique({ where: { id }, include: {
    contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
    revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
  } });
  if (!item) notFound();
  return <div className="min-h-screen flex flex-col bg-slate-50"><Navbar /><main className="container mx-auto max-w-7xl flex-1 px-4 pb-24 pt-8 lg:pb-8 sm:px-6 lg:px-8">
    <Link href={`/admin/reviews/${encodeURIComponent(item.id)}/preview`} target="_blank" rel="noopener noreferrer" className="action-secondary-detail fixed bottom-4 right-4 z-30 min-h-11 bg-white shadow-lg lg:hidden">Xem trước</Link>
    <Link href="/admin/reviews" className="text-sm text-slate-500 hover:text-[#0F294A]">← Danh sách chờ duyệt</Link>
    {item.status === 'PUBLISHED' && <p className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Bạn đang xem bản cập nhật được gửi duyệt. Bài đã xuất bản vẫn giữ nội dung cũ đến khi bản này được duyệt.</p>}
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><SubmissionPreview snapshot={getReviewSnapshot(item)} />{canReviewItem(item) ? <ApprovalControls itemId={item.id} reviewVersion={item.reviewVersion} /> : <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Bài không còn ở trạng thái chờ duyệt.</p>}</div>
  </main><AcademicFooter /></div>;
}
