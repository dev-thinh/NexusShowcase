import { getActor } from '@/features/identity/server/actor';
import { ManagementFilters } from '@/shared/ui/management-filters';
import { AdminBulkPosts } from '@/features/publications/components/admin-bulk-posts';
import { TypeBadge } from '@/features/publications/components/badges';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import type { BulkPostFilter } from '@/features/publications/model/bulk-posts';
import { searchBulkPostsAction } from '@/features/publications/server/bulk-actions';
import { PaginationFooter } from '@/shared/ui/member-pagination';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const filters: { value: BulkPostFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' }, { value: 'PINNED', label: 'Đang ghim' },
  { value: 'PUBLIC', label: 'Công khai' }, { value: 'PRIVATE', label: 'Nội bộ' },
];

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  if (!await getActor(['ADMIN'])) redirect('/login?callbackUrl=/admin/content');
  const params = await searchParams;
  const query = (params.q ?? '').trim().slice(0, 200);
  const filter = filters.find(option => option.value === params.filter)?.value ?? 'ALL';
  const rawPage = /^\d+$/.test(params.page ?? '') ? Number(params.page) : 1;
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 1_000_000) : 1;
  const result = await searchBulkPostsAction({ query, filter, page });
  if (!result.success) throw new Error(result.error);
  const baseParams = new URLSearchParams({ filter, ...(query ? { q: query } : {}) });
  return <section aria-labelledby="admin-content-title">
    <div className="mb-4"><h2 id="admin-content-title" className="text-lg font-semibold text-slate-900">Nội dung</h2><p className="mt-1 text-sm text-slate-500">Quản lý ghim và phạm vi hiển thị của công trình đã xuất bản.</p></div>
    <ManagementFilters action="/admin/content" query={query} searchLabel="Tìm công trình đã xuất bản" placeholder="Tìm theo tiêu đề…" filterName="filter" filterValue={filter} filterLabel="Lọc nội dung" options={filters.map(option => ({ ...option, count: result.counts[option.value] }))} actions={<div className="admin-bulk-actions"><AdminBulkPosts mode="pin" /><AdminBulkPosts mode="visibility" /></div>} />
    <p className="mb-3 text-sm text-slate-500">{result.total} công trình{query ? ` phù hợp với “${query}”` : ''}</p>
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {!result.items.length ? <p className="p-6 text-sm text-slate-500">{query ? 'Không tìm thấy công trình phù hợp.' : 'Chưa có công trình trong nhóm này.'}</p> : result.items.map(item => <article key={item.id} className="admin-content-row p-3 sm:p-4 sm:px-5">
        <div className="admin-content-row__meta flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <TypeBadge type={item.type ?? 'PROJECT'} size="sm" variant="outline" />
            {item.publishedYear && <span className="text-xs tabular-nums text-slate-500">{item.publishedYear}</span>}
          </div>
          <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />
        </div>
        <Link href={`/showcase/${item.slug}`} title={item.title} target="_blank" rel="noopener noreferrer" className="admin-content-row__title mt-1 flex min-w-0 items-start justify-between gap-2 text-sm font-semibold leading-5 text-slate-800 hover:underline">
          <span className="min-w-0 break-words">{item.title}</span>
          <ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        </Link>
      </article>)}
    </div>
    {result.total > 0 && <PaginationFooter page={result.page} totalPages={result.totalPages} pageSize={10} basePath={`/admin/content?${baseParams}`} ariaLabel="Phân trang nội dung" />}
  </section>;
}
