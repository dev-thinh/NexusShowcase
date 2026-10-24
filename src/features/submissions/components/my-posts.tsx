'use client';

import { MediaImage } from '@/shared/ui/media-image';

import { StatusBadge, TypeBadge } from '@/features/publications/components/badges';
import { WithdrawSubmissionButton } from '@/features/submissions/components/withdraw-submission-button';
import { postFilters, type PostFilter } from '@/features/submissions/model/dashboard-items';
import { canReviewItem } from '@/features/submissions/model/workflow-state';
import { EmptyState } from '@/shared/ui/empty-state';
import type { ShowcaseItem } from '@prisma/client';
import { AlertCircle, ArrowRight, FolderPlus, Search } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';


export type MyPost = Pick<ShowcaseItem, 'id' | 'slug' | 'title' | 'summary' | 'type' | 'status' | 'reviewStatus' | 'reviewVersion' | 'rejectionReason' | 'publishedYear' | 'updatedAt' | 'thumbnailUrl'>;

export function MyPosts({ items, isUploader, query, filter, counts, total }: { items: MyPost[]; isUploader: boolean; query: string; filter: PostFilter; counts: Record<PostFilter, number>; total: number }) {
  const filteredItems = items;
  return <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-labelledby="my-posts-title">
    <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 id="my-posts-title" className="text-lg font-semibold text-[#1F2937]">Bài đăng <span className="ml-1 text-sm font-normal text-[#1F2937]">{total}</span></h2><form action="/dashboard" method="GET" className="relative w-full sm:max-w-xs"><input type="hidden" name="filter" value={filter} /><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F2937]" /><label htmlFor="my-post-search" className="sr-only">Tìm bài đăng</label><input id="my-post-search" type="search" name="q" defaultValue={query} placeholder="Tìm bài đăng…" className="min-h-10 w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-200 focus:ring-2 focus:ring-[#153D67]/10" /><button className="sr-only" type="submit">Tìm kiếm</button></form></div>
      <div role="group" aria-label="Lọc trạng thái bài đăng" className="flex max-w-full gap-1 overflow-x-auto">{postFilters.map(option => <Link key={option.value} href={`/dashboard?${new URLSearchParams({ filter: option.value, ...(query ? { q: query } : {}) })}`} aria-current={filter === option.value ? "page" : undefined} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67] ${filter === option.value ? 'bg-[#FFFFFF] text-[#1F2937]' : 'text-[#1F2937] hover:bg-[#FFFFFF] hover:text-[#1F2937]'}`}>{option.label}<span className="tabular-nums opacity-70">{counts[option.value]}</span></Link>)}</div>
    </div>
    {!counts.ALL ? <div className="p-4 sm:p-5"><EmptyState icon={FolderPlus} title="Bạn chưa có bài đăng nào" description={isUploader ? 'Tạo bài đầu tiên để giới thiệu công trình của bạn.' : 'Liên hệ quản trị viên để được cấp quyền đăng bài.'} actionLabel={isUploader ? 'Đăng bài mới' : undefined} actionHref={isUploader ? '/dashboard/items/new' : undefined} /></div> : !filteredItems.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-[#1F2937]">Không có bài đăng phù hợp</p><Link href="/dashboard" className="mt-3 text-sm font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link></div> : <div className="divide-y divide-[#153D67]">{filteredItems.map(item => {
      const editable = isUploader && (['DRAFT', 'REVISION_REQUESTED'].includes(item.status) || item.status === 'PUBLISHED' && !canReviewItem(item));
      const feedback = (['REJECTED', 'REVISION_REQUESTED'].includes(item.status) || ['REJECTED', 'REVISION_REQUESTED'].includes(item.reviewStatus ?? '')) && item.rejectionReason;
      const href = editable && item.status !== 'PUBLISHED' ? `/dashboard/items/${item.id}/edit` : `/showcase/${item.slug}`;
      return <article key={item.id} className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {<Link href={href} tabIndex={-1} aria-hidden="true" className="hidden shrink-0 sm:block"><MediaImage src={item.thumbnailUrl} alt="" loading="lazy" className="h-20 w-28 rounded-md border border-slate-200 object-cover" /></Link>}
          <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><TypeBadge type={item.type} size="sm" /><StatusBadge status={item.status} size="sm" />{item.reviewStatus && <span className="inline-flex items-center gap-1 text-xs text-[#1F2937]">Bản cập nhật:<StatusBadge status={item.reviewStatus} size="sm" /></span>}</div><h3><Link href={href} className="break-words text-base font-semibold leading-6 text-[#1F2937] hover:text-[#1F2937]">{item.title || 'Bài chưa có tiêu đề'}</Link></h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#1F2937]">{item.summary || 'Chưa có tóm tắt.'}</p><p className="mt-2 text-xs text-[#1F2937]">{item.publishedYear} · Cập nhật {new Date(item.updatedAt).toLocaleDateString('vi-VN')}</p></div>
        </div>
        {feedback && <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-200 bg-[#FFFFFF] px-3 py-2 text-sm leading-6 text-[#1F2937]"><AlertCircle aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /><p><span className="font-semibold">Phản hồi: </span>{feedback}</p></div>}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {isUploader && canReviewItem(item) && <WithdrawSubmissionButton itemId={item.id} reviewVersion={item.reviewVersion} />}
          {editable ? <Link href={`/dashboard/items/${item.id}/edit`} className="action-secondary-card">{item.status === 'PUBLISHED' ? 'Soạn bản cập nhật' : item.status === 'REVISION_REQUESTED' ? 'Sửa theo phản hồi' : 'Chỉnh sửa'}</Link> : (item.status === 'REJECTED' || !isUploader && ['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) && <span className="text-xs text-[#1F2937]">Chỉ đọc</span>}
          <Link href={`/showcase/${item.slug}`} className="action-secondary-card">{item.status === 'PUBLISHED' ? 'Xem bài' : 'Xem trước'}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
      </article>;
    })}</div>}
    {items.length > 0 && <p aria-live="polite" className="border-t border-slate-200 px-4 py-3 text-xs text-[#1F2937] sm:px-5">Hiển thị {filteredItems.length} / {total} bài đăng</p>}
  </section>;
}
