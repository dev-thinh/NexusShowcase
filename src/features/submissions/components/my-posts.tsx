'use client';

import { ManagementFilters } from '@/shared/ui/management-filters';
import { MediaImage } from '@/shared/ui/media-image';

import { StatusBadge, TypeBadge } from '@/features/publications/components/badges';
import { WithdrawSubmissionButton } from '@/features/submissions/components/withdraw-submission-button';
import { postFilters, type PostFilter } from '@/features/submissions/model/dashboard-items';
import { canReviewItem } from '@/features/submissions/model/workflow-state';
import { EmptyState } from '@/shared/ui/empty-state';
import type { ShowcaseItem } from '@prisma/client';
import { AlertCircle, ArrowRight, FolderPlus } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';


export type MyPost = Pick<ShowcaseItem, 'id' | 'slug' | 'title' | 'summary' | 'type' | 'status' | 'reviewStatus' | 'reviewVersion' | 'rejectionReason' | 'publishedYear' | 'updatedAt' | 'thumbnailUrl'> & { canManage: boolean };

export function MyPosts({ items, isUploader, query, filter, counts, total }: { items: MyPost[]; isUploader: boolean; query: string; filter: PostFilter; counts: Record<PostFilter, number>; total: number }) {
  const filteredItems = items;
  return <section className="min-w-0" aria-labelledby="my-posts-title">
    <div className="mb-4 space-y-4">
      <h2 id="my-posts-title" className="text-lg font-semibold text-[#1F2937]">Công trình <span className="ml-1 text-sm font-normal text-slate-500">{total}</span></h2>
      <ManagementFilters action="/dashboard" query={query} searchId="my-post-search" searchLabel="Tìm công trình" placeholder="Tìm công trình…" filterName="filter" filterValue={filter} filterLabel="Lọc trạng thái bài đăng" options={postFilters.map(option => ({ ...option, count: counts[option.value] }))} />
    </div>
    {!counts.ALL ? <div className="p-4 sm:p-5"><EmptyState icon={FolderPlus} title="Bạn chưa có công trình nào" description={isUploader ? 'Các công trình bạn đăng hoặc tham gia sẽ xuất hiện tại đây.' : 'Liên hệ quản trị viên để được cấp quyền đăng bài.'} actionLabel={isUploader ? 'Đăng bài mới' : undefined} actionHref={isUploader ? '/dashboard/items/new' : undefined} /></div> : !filteredItems.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-[#1F2937]">Không có công trình phù hợp</p><Link href="/dashboard" className="mt-3 text-sm font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link></div> : <div className="panel-operational divide-y divide-slate-100 overflow-hidden !rounded-xl !p-0 !shadow-none">{filteredItems.map(item => {
      const editable = item.canManage && isUploader && (['DRAFT', 'REVISION_REQUESTED'].includes(item.status) || item.status === 'PUBLISHED' && !canReviewItem(item));
      const feedback = (['REJECTED', 'REVISION_REQUESTED'].includes(item.status) || ['REJECTED', 'REVISION_REQUESTED'].includes(item.reviewStatus ?? '')) && item.rejectionReason;
      const canView = item.canManage || item.status === 'PUBLISHED';
      const href = editable && item.status !== 'PUBLISHED' ? `/dashboard/items/${item.id}/edit` : `/showcase/${item.slug}`;
      return <article key={item.id} className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {canView && <Link href={href} tabIndex={-1} aria-hidden="true" className="hidden shrink-0 sm:block"><MediaImage src={item.thumbnailUrl} alt="" loading="lazy" className="h-20 w-28 rounded-md border border-slate-200 object-cover" /></Link>}
          <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><TypeBadge type={item.type} size="sm" /><StatusBadge status={item.status} size="sm" />{item.reviewStatus && <span className="inline-flex items-center gap-1 text-xs text-[#1F2937]">Bản cập nhật:<StatusBadge status={item.reviewStatus} size="sm" /></span>}</div><h3 className="break-words text-base font-semibold leading-6 text-[#1F2937]">{canView ? <Link href={href}>{item.title || 'Công trình chưa có tiêu đề'}</Link> : item.title || 'Công trình chưa có tiêu đề'}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#1F2937]">{item.summary || 'Chưa có tóm tắt.'}</p><p className="mt-2 text-xs text-[#1F2937]">{item.publishedYear} · Cập nhật {new Date(item.updatedAt).toLocaleDateString('vi-VN')}</p></div>
        </div>
        {feedback && <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-200 bg-[#FFFFFF] px-3 py-2 text-sm leading-6 text-[#1F2937]"><AlertCircle aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /><p><span className="font-semibold">Phản hồi: </span>{feedback}</p></div>}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {!item.canManage && <span className="text-xs text-[#1F2937]">Chỉ theo dõi</span>}
          {item.canManage && isUploader && canReviewItem(item) && <WithdrawSubmissionButton itemId={item.id} reviewVersion={item.reviewVersion} />}
          {editable ? <Link href={`/dashboard/items/${item.id}/edit`} className="action-secondary-card">{item.status === 'PUBLISHED' ? 'Soạn bản cập nhật' : item.status === 'REVISION_REQUESTED' ? 'Sửa theo phản hồi' : 'Chỉnh sửa'}</Link> : (item.status === 'REJECTED' || !isUploader && ['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) && <span className="text-xs text-[#1F2937]">Chỉ đọc</span>}
          {item.canManage && isUploader && !editable && <Link href={`/dashboard/items/${item.id}/edit`} className="action-secondary-card">Bản khôi phục</Link>}
          {canView && <Link href={`/showcase/${item.slug}`} className="action-secondary-card">{item.status === 'PUBLISHED' ? 'Xem bài' : 'Xem trước'}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>}
        </div>
      </article>;
    })}</div>}
  </section>;
}
