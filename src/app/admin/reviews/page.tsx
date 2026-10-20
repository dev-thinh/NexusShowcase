import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { pendingReviewWhere, getReviewSnapshot } from '@/lib/direct-review';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default async function AdminReviewsPage() {
  if (!await getCurrentUser(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const items = await prisma.showcaseItem.findMany({ where: pendingReviewWhere, include: {
    creator: { select: { fullName: true } },
    contributors: { include: { user: { select: { fullName: true } } }, orderBy: { displayOrder: 'asc' } }, links: true, attachments: true,
    revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 }, editorialDraft: true,
  }, orderBy: { updatedAt: 'asc' } });
  return <div className="min-h-screen flex flex-col"><Navbar /><main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <Link href="/admin" className="text-sm text-slate-500 hover:text-[#0F294A]">← Bàn làm việc quản trị</Link>
    <header className="my-6 border-b border-slate-200 pb-5"><h1 className="text-3xl font-semibold text-[#0F294A]">Phê duyệt bài đăng</h1><p className="mt-2 text-sm text-slate-600">{items.length} bản nộp chờ duyệt. Xem nội dung và quyết định xuất bản, yêu cầu sửa hoặc từ chối.</p></header>
    {!items.length ? <EmptyState icon={CheckCircle2} title="Không có bài chờ duyệt" description="Các bản nộp đã được xử lý." /> : <div className="panel-operational divide-y divide-slate-200 !p-0">{items.map(item => {
      const snapshot = getReviewSnapshot(item);
      return <div key={item.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div className="min-w-0"><p className="mb-2 text-xs font-semibold text-amber-700">{item.status === 'PUBLISHED' ? 'Bản cập nhật · Bài hiện tại vẫn đang hiển thị' : 'Chờ duyệt'}</p><Link href={`/admin/reviews/${item.id}`} className="break-words text-lg font-semibold text-[#0F294A] hover:underline">{snapshot.title}</Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{snapshot.summary}</p><p className="mt-2 text-xs text-slate-500">Người nộp: {item.creator.fullName} · {snapshot.publishedYear}</p></div><Link href={`/admin/reviews/${item.id}`} className="action-primary-detail min-h-11 shrink-0">Xem và duyệt<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>;
    })}</div>}
  </main><AcademicFooter /></div>;
}
