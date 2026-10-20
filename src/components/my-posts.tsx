'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ShowcaseItem } from '@prisma/client';
import { Search, FolderPlus, ArrowRight, AlertCircle } from 'lucide-react';
import { canReviewItem } from '@/lib/direct-review';
import { matchesPostFilter, postFilters, type PostFilter } from '@/lib/dashboard-items';
import { StatusBadge, TypeBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { WithdrawSubmissionButton } from '@/components/withdraw-submission-button';

export type MyPost = Pick<ShowcaseItem, 'id' | 'slug' | 'title' | 'summary' | 'type' | 'status' | 'reviewStatus' | 'reviewVersion' | 'rejectionReason' | 'publishedYear' | 'updatedAt' | 'thumbnailUrl'>;

export function MyPosts({ items, isUploader }: { items: MyPost[]; isUploader: boolean }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PostFilter>('ALL');
  const filteredItems = items.filter(item => matchesPostFilter(item, filter, query));
  return <section className="panel-operational min-w-0 !p-0 !shadow-none" aria-labelledby="my-posts-title">
    <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 id="my-posts-title" className="text-lg font-semibold text-[#0F294A]">Bài đăng <span className="ml-1 text-sm font-normal text-slate-500">{items.length}</span></h2><div className="relative w-full sm:max-w-xs"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><label htmlFor="my-post-search" className="sr-only">Tìm bài đăng</label><input id="my-post-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm bài đăng…" className="min-h-10 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10" /></div></div>
      <div role="group" aria-label="Lọc trạng thái bài đăng" className="flex max-w-full gap-1 overflow-x-auto">{postFilters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F294A] ${filter === option.value ? 'bg-blue-50 text-[#0F294A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{option.label}<span className="tabular-nums opacity-70">{items.filter(item => matchesPostFilter(item, option.value)).length}</span></button>)}</div>
    </div>
    {!items.length ? <div className="p-4 sm:p-5"><EmptyState icon={FolderPlus} title="Bạn chưa có bài đăng nào" description={isUploader ? 'Tạo bài đầu tiên để giới thiệu công trình của bạn.' : 'Liên hệ quản trị viên để được cấp quyền đăng bài.'} actionLabel={isUploader ? 'Đăng bài mới' : undefined} actionHref={isUploader ? '/dashboard/items/new' : undefined} /></div> : !filteredItems.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-slate-700">Không có bài đăng phù hợp</p><button type="button" onClick={() => { setQuery(''); setFilter('ALL'); }} className="mt-3 text-sm font-semibold text-[#0F294A] hover:underline">Xóa bộ lọc</button></div> : <div className="divide-y divide-slate-200">{filteredItems.map(item => {
      const editable = isUploader && (['DRAFT', 'REVISION_REQUESTED'].includes(item.status) || item.status === 'PUBLISHED' && !canReviewItem(item));
      const feedback = (['REJECTED', 'REVISION_REQUESTED'].includes(item.status) || ['REJECTED', 'REVISION_REQUESTED'].includes(item.reviewStatus ?? '')) && item.rejectionReason;
      const href = editable && item.status !== 'PUBLISHED' ? `/dashboard/items/${item.id}/edit` : `/showcase/${item.slug}`;
      return <article key={item.id} className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {item.thumbnailUrl && <Link href={href} tabIndex={-1} aria-hidden="true" className="hidden shrink-0 sm:block"><img src={item.thumbnailUrl} alt="" loading="lazy" className="h-20 w-28 rounded-md border border-slate-200 object-cover" /></Link>}
          <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><TypeBadge type={item.type} size="sm" /><StatusBadge status={item.status} size="sm" />{item.reviewStatus && <span className="inline-flex items-center gap-1 text-xs text-slate-500">Bản cập nhật:<StatusBadge status={item.reviewStatus} size="sm" /></span>}</div><h3><Link href={href} className="break-words text-base font-semibold leading-6 text-slate-900 hover:text-[#0F294A]">{item.title || 'Bài chưa có tiêu đề'}</Link></h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{item.summary || 'Chưa có tóm tắt.'}</p><p className="mt-2 text-xs text-slate-500">{item.publishedYear} · Cập nhật {new Date(item.updatedAt).toLocaleDateString('vi-VN')}</p></div>
        </div>
        {feedback && <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900"><AlertCircle aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /><p><span className="font-semibold">Phản hồi: </span>{feedback}</p></div>}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {isUploader && canReviewItem(item) && <WithdrawSubmissionButton itemId={item.id} reviewVersion={item.reviewVersion} />}
          {editable ? <Link href={`/dashboard/items/${item.id}/edit`} className="action-secondary-card">{item.status === 'PUBLISHED' ? 'Soạn bản cập nhật' : item.status === 'REVISION_REQUESTED' ? 'Sửa theo phản hồi' : 'Chỉnh sửa'}</Link> : (item.status === 'REJECTED' || !isUploader && ['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) && <span className="text-xs text-slate-500">Chỉ đọc</span>}
          <Link href={`/showcase/${item.slug}`} className="action-secondary-card">{item.status === 'PUBLISHED' ? 'Xem bài' : 'Xem trước'}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
      </article>;
    })}</div>}
    {items.length > 0 && <p aria-live="polite" className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">Hiển thị {filteredItems.length} / {items.length} bài đăng</p>}
  </section>;
}
