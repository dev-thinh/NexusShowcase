import { getActor } from '@/features/identity/server/actor';
import { SearchForm as Form } from '@/shared/ui/validated-form';
import { listReviewQueue } from '@/features/review/server/queries';
import { MemberPagination } from '@/shared/ui/member-pagination';


import { EmptyState } from '@/shared/ui/empty-state';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { redirect } from 'next/navigation';

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  if (!await getActor(['ADMIN'])) redirect('/login?callbackUrl=/admin/reviews');
  const params = await searchParams;
  const query = (params.q ?? '').trim().slice(0, 200);
  const result = await listReviewQueue(params.page, query);
  const items = result.items;
  const basePath = '/admin/reviews' + (query ? `?${new URLSearchParams({ q: query })}` : '');
  const returnTo = '/admin/reviews' + (query || params.page ? `?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(params.page ? { page: params.page } : {}) })}` : '');
  return <section aria-labelledby="admin-reviews-title">
    <div className="mb-4"><h2 id="admin-reviews-title" className="text-lg font-semibold text-slate-900">Phê duyệt</h2><p className="mt-1 text-sm text-slate-500">{result.total} bản nộp chờ duyệt.</p></div>
    <Form scroll={false} prefetch={false} action="/admin/reviews" className="mb-4 flex max-w-lg gap-2"><input name="q" type="search" defaultValue={query} maxLength={200} aria-label="Tìm bản nộp chờ duyệt" placeholder="Tìm theo tiêu đề hoặc người nộp…" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]/30" /><button type="submit" className="action-secondary-detail">Tìm kiếm</button></Form>
    {!items.length ? <EmptyState icon={CheckCircle2} title="Không có bài chờ duyệt" description="Các bản nộp đã được xử lý." /> : <div className="panel-operational divide-y divide-[#153D67] !p-0">{items.map(item => {
      const snapshot = item;
      return <div key={item.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div className="min-w-0"><p className="mb-2 text-xs font-semibold text-[#1F2937]">{item.status === 'PUBLISHED' ? 'Bản cập nhật · Bài hiện tại vẫn đang hiển thị' : 'Chờ duyệt'}</p><Link href={`/admin/reviews/${item.id}?${new URLSearchParams({ returnTo })}`} scroll={false} className="break-words text-lg font-semibold text-[#1F2937] hover:underline">{snapshot.title}</Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#1F2937]">{snapshot.summary}</p><p className="mt-2 text-xs text-[#1F2937]">Người nộp: {item.creatorName} · {snapshot.publishedYear}</p></div><Link href={`/admin/reviews/${item.id}?${new URLSearchParams({ returnTo })}`} scroll={false} className="action-primary-detail min-h-11 shrink-0">Xem và duyệt<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>;
    })}</div>}
    <MemberPagination page={result.page} totalPages={result.totalPages} basePath={basePath} ariaLabel="Phân trang bản nộp" />
  </section>;
}
