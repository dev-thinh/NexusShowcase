import { getActor } from '@/features/identity/server/actor';
import { SearchForm as Form } from '@/shared/ui/validated-form';
import { AdminBulkPosts } from '@/features/publications/components/admin-bulk-posts';
import { TypeBadge } from '@/features/publications/components/badges';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import type { BulkPostFilter } from '@/features/publications/model/bulk-posts';
import { searchBulkPostsAction } from '@/features/publications/server/bulk-actions';
import { MemberPagination } from '@/shared/ui/member-pagination';
import { ArrowUpRight, Search } from 'lucide-react';
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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Form scroll={false} prefetch={false} action="/admin/content" className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1 sm:max-w-md">
        <input type="hidden" name="filter" value={filter} />
        <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input name="q" type="search" defaultValue={query} maxLength={200} aria-label="Tìm công trình đã xuất bản" placeholder="Tìm theo tiêu đề…" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]/30" /></div>
        <button type="submit" className="action-secondary-detail">Tìm kiếm</button>
      </Form>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto"><AdminBulkPosts mode="pin" /><AdminBulkPosts mode="visibility" /></div>
    </div>
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Lọc nội dung">
      {filters.map(option => {
        const next = new URLSearchParams(baseParams); next.set('filter', option.value);
        return <Link key={option.value} href={`/admin/content?${next}`} scroll={false} aria-current={filter === option.value ? 'true' : undefined} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30 ${filter === option.value ? 'border-[#153D67] bg-[#153D67] font-semibold text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}>{option.label}<span className="text-xs tabular-nums">{result.counts[option.value]}</span></Link>;
      })}
    </div>
    <p className="mb-3 text-sm text-slate-500">{result.total} công trình{query ? ` phù hợp với “${query}”` : ''}</p>
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {!result.items.length ? <p className="p-6 text-sm text-slate-500">{query ? 'Không tìm thấy công trình phù hợp.' : 'Chưa có công trình trong nhóm này.'}</p> : result.items.map(item => <article key={item.id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><TypeBadge type={item.type ?? 'PROJECT'} size="sm" />{item.publishedYear && <span className="text-xs text-slate-500">{item.publishedYear}</span>}</div><Link href={`/showcase/${item.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-2 text-sm font-semibold text-slate-800 hover:underline"><span className="min-w-0 break-words">{item.title}</span><ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /></Link></div>
        <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />
      </article>)}
    </div>
    {result.totalPages > 1 && <div className="mt-5"><MemberPagination page={result.page} totalPages={result.totalPages} basePath={`/admin/content?${baseParams}`} ariaLabel="Phân trang nội dung" /></div>}
  </section>;
}
