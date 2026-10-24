import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getActor } from '@/features/identity/server/actor';
import { listReviewQueue } from '@/features/review/server/queries';
import { MemberPagination } from '@/shared/ui/member-pagination';


import { EmptyState } from '@/shared/ui/empty-state';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { redirect } from 'next/navigation';

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!await getActor(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const result = await listReviewQueue((await searchParams).page);
  const items = result.items;
  return <><main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: "Quản trị", href: "/admin" }, { label: "Phê duyệt bài đăng" }]} />
    <header className="my-6 border-b border-slate-200 pb-5"><span className="page-eyebrow">Quản trị nội dung</span><h1 className="page-title">Phê duyệt bài đăng</h1><p className="mt-2 text-sm text-[#1F2937]">{result.total} bản nộp chờ duyệt. Xem nội dung và quyết định xuất bản, yêu cầu sửa hoặc từ chối.</p></header>
    {!items.length ? <EmptyState icon={CheckCircle2} title="Không có bài chờ duyệt" description="Các bản nộp đã được xử lý." /> : <div className="panel-operational divide-y divide-[#153D67] !p-0">{items.map(item => {
      const snapshot = item;
      return <div key={item.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div className="min-w-0"><p className="mb-2 text-xs font-semibold text-[#1F2937]">{item.status === 'PUBLISHED' ? 'Bản cập nhật · Bài hiện tại vẫn đang hiển thị' : 'Chờ duyệt'}</p><Link href={`/admin/reviews/${item.id}`} className="break-words text-lg font-semibold text-[#1F2937] hover:underline">{snapshot.title}</Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#1F2937]">{snapshot.summary}</p><p className="mt-2 text-xs text-[#1F2937]">Người nộp: {item.creatorName} · {snapshot.publishedYear}</p></div><Link href={`/admin/reviews/${item.id}`} className="action-primary-detail min-h-11 shrink-0">Xem và duyệt<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>;
    })}</div>}
    <MemberPagination page={result.page} totalPages={result.totalPages} basePath="/admin/reviews" ariaLabel="Phân trang bản nộp" />
  </main></>;
}
