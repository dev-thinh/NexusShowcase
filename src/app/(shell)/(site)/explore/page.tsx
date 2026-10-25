import { SearchForm } from '@/shared/ui/validated-form';
import { MediaImage } from '@/shared/ui/media-image';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import type { Metadata } from 'next';
import { CustomSelect } from '@/shared/ui/custom-select';
import { getSession as auth } from '@/features/identity/server/session';
import { TypeBadge } from '@/features/publications/components/badges';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import { CardLink } from '@/features/publications/components/card-link';
import { CitationModal } from '@/features/publications/components/citation-modal';
import { PublicationNavigation } from '@/features/publications/components/publication-navigation';
import { toCitationDto } from '@/features/publications/model/contracts';
import { showcaseHref } from '@/features/publications/model/navigation';
import { listPublications } from '@/features/publications/server/queries';
import { EmptyState } from '@/shared/ui/empty-state';
import { MemberPagination } from '@/shared/ui/member-pagination';
import {
ArrowRight,
BookOpen,
ExternalLink,
Github,
Globe,
Search,
} from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';


export const metadata: Metadata = { title: 'Khám phá công trình' };

export default async function ExplorePage({ searchParams }: {
  searchParams: Promise<{ q?: string; page?: string; year?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? '';
  const requestedYear = Number(params.year);
  const year = Number.isInteger(requestedYear) && requestedYear >= 1900 && requestedYear <= 2100 ? requestedYear : undefined;
  const sort = params.sort === 'oldest' || params.sort === 'title' || params.sort === 'featured' ? params.sort : 'newest';
  const filters = new URLSearchParams();
  if (searchQuery) filters.set('q', searchQuery);
  if (year) filters.set('year', String(year));
  if (sort !== 'newest') filters.set('sort', sort);
  const hasFilters = filters.size > 0;
  const searchPath = '/explore' + (filters.size ? '?' + filters : '');
  const pageSize = 10;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';
  const { items: searchItems, total: totalItems, totalPages, page } = await listPublications({ authenticated: !!session?.user, q: searchQuery, year, sort, page: params.page, pageSize });
  const returnTo = searchPath + (page > 1 ? (filters.size ? '&' : '?') + 'page=' + page : '');
    return (
      <>

        <section className="bg-white pt-8 sm:pt-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[{ label: "Khám phá công trình" }]} />
            <p className="page-eyebrow">Nghiên cứu &amp; sáng tạo</p>
            <h1 className="page-title mt-2 max-w-4xl text-balance">Khám phá các bài nghiên cứu và dự án của CLB Robotics &amp; IoT.</h1>
            <PublicationNavigation currentHref="/explore" />

          </div>
        </section>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl flex-1">
            <SearchForm action="/explore" role="search" aria-label="Tìm kiếm và lọc công trình" className="mb-6 grid items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_8rem_11rem_auto]">
              <div className="min-w-0">
                <label htmlFor="library-search" className="text-xs font-semibold text-[#1F2937]">Tìm kiếm toàn bộ kho</label>
                <div className="relative mt-2">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F2937]" />
                <input id="library-search" type="search" name="q" defaultValue={searchQuery} aria-label="Từ khóa tìm kiếm" placeholder="Tiêu đề, tác giả, từ khóa..." className="h-11 w-full rounded-lg border border-slate-200 bg-[#FFFFFF] pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]" />
                </div>
              </div>
              <div>
                <label htmlFor="library-year" className="text-xs font-semibold text-[#1F2937]">Năm thực hiện</label>
                <input id="library-year" type="text" inputMode="numeric" name="year" min={1900} max={2100} defaultValue={year ?? ''} placeholder="Tất cả" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#FFFFFF] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]" />
              </div>
              <div>
                <label htmlFor="library-sort" className="text-xs font-semibold text-[#1F2937]">Sắp xếp</label>
                <CustomSelect key={sort} id="library-sort" name="sort" defaultValue={sort} className="mt-2" options={[
                  { value: 'featured', label: 'Ưu tiên nổi bật' },
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'oldest', label: 'Cũ nhất' },
                  { value: 'title', label: 'Tiêu đề A–Z' },
                ]} />
              </div>
              <button type="submit" className="h-11 rounded-lg bg-brand-button px-5 text-sm font-semibold text-white transition hover:brightness-110">Áp dụng</button>
              {hasFilters && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 md:col-span-4">
                <p className="break-words text-xs text-[#1F2937]">Kết quả lọc công trình{searchQuery ? ` với “${searchQuery}”` : ''}{year ? ` · Năm ${year}` : ''}</p>
                <Link href="/explore" className="inline-flex min-h-9 items-center text-xs font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link>
              </div>}
            </SearchForm>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-semibold text-[#1F2937]">{searchQuery ? `${totalItems} công trình cho “${searchQuery}”` : hasFilters ? `${totalItems} công trình phù hợp` : `Tất cả công trình · ${totalItems} công trình`}</h2>
              {year && <p className="mt-1 text-xs text-[#1F2937]">Năm thực hiện: {year}</p>}
              {totalItems > 0 && <p className="mt-1 text-xs text-[#1F2937]">Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} / {totalItems} công trình</p>}
            </div>
          </div>
          {totalItems === 0 ? (
            <EmptyState icon={hasFilters ? Search : BookOpen} title={hasFilters ? 'Không tìm thấy công trình phù hợp' : 'Chưa có công trình nào'} description={hasFilters ? 'Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ kho công trình.' : 'Các bài nghiên cứu và dự án sẽ xuất hiện tại đây sau khi được xuất bản.'} actionLabel={hasFilters ? 'Xóa bộ lọc' : 'Về trang chủ'} actionHref={hasFilters ? '/explore' : '/'} />
          ) : (
            <>
              <div className="space-y-4">
                {searchItems.map(item => {
                  const isPaper = item.type === 'RESEARCH_PAPER';
                  const paperLink = item.links.find(link => link.type === 'PAPER_URL');
                  const githubLink = item.links.find(link => link.type === 'GITHUB');
                  const demoLink = item.links.find(link => link.type === 'LIVE_DEMO');
                  return (
                    <article key={item.id} className="clickable-card panel-public grid gap-5 transition-shadow hover:shadow-md sm:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-7">
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="flex aspect-[4/3] items-center justify-center self-start overflow-hidden rounded-lg border border-slate-200 bg-[#FFFFFF]">
                        <MediaImage src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                      </Link>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[#1F2937]">
                          <TypeBadge type={item.type} size="sm" variant="outline" />
                          {item.publishedYear && <span>{item.publishedYear}</span>}
                        </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>
                        <h3 className="mt-3 h-7 shrink-0 line-clamp-1 text-lg font-semibold leading-7 text-[#1F2937]" title={item.title}><Link href={showcaseHref(item.slug, returnTo)} className="hover:underline">{item.title}</Link></h3>
                        <p className="mt-2 truncate text-sm leading-6 text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>{item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}</p>
                        {item.issuer && <p className="mt-1 truncate text-xs italic leading-4 text-[#1F2937]">{item.issuer}</p>}
                        <p className="mb-3 mt-3 h-12 shrink-0 line-clamp-2 break-words text-sm leading-6 text-[#1F2937]">{item.summary}</p>
                        <footer className="-mb-5 mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-200 py-1 text-sm sm:-mb-6">
                          {isPaper && <CitationModal item={toCitationDto(item)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[#1F2937] hover:underline" />}
                          {isPaper && paperLink && <a href={paperLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-[#1F2937] hover:underline">Bài báo gốc <ExternalLink aria-hidden="true" className="h-3 w-3" /></a>}
                          {!isPaper && githubLink && <a href={githubLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-[#1F2937] hover:underline"><Github aria-hidden="true" className="h-3.5 w-3.5" />Mã nguồn</a>}
                          {!isPaper && demoLink && <a href={demoLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-[#1F2937] hover:underline"><Globe aria-hidden="true" className="h-3.5 w-3.5" />Demo</a>}
                          <Link href={showcaseHref(item.slug, returnTo)} className="ml-auto inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#1F2937] hover:underline">Xem công trình <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                        </footer>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <p className="text-xs text-[#1F2937]">Trang {page} / {totalPages} · 10 công trình mỗi trang</p>
                <MemberPagination page={page} totalPages={totalPages} basePath={searchPath} ariaLabel="Phân trang kho công trình" />
              </div>
            </>
          )}
        </main>

      </>
    );

}
