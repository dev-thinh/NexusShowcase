import { SearchForm } from '@/shared/ui/validated-form';
import { MediaImage } from '@/shared/ui/media-image';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getSession as auth } from '@/features/identity/server/session';
import { TypeBadge } from '@/features/publications/components/badges';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import { CardLink } from '@/features/publications/components/card-link';
import { CitationModal } from '@/features/publications/components/citation-modal';
import { PublicationNavigation } from '@/features/publications/components/publication-navigation';
import { toCitationDto } from '@/features/publications/model/contracts';
import { showcaseHref } from '@/features/publications/model/navigation';
import { listPublications } from '@/features/publications/server/queries';
import { prisma } from '@/server/db/prisma';
import { CustomSelect } from '@/shared/ui/custom-select';
import { LoadingCards } from '@/shared/ui/loading-content';
import { MemberPagination } from '@/shared/ui/member-pagination';
import { ArrowRight, ExternalLink, Github, Globe, Search, Sparkles } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; year?: string; sort?: string }>;
}) {
  const { slug } = await params;
  if (slug === 'du-an-sang-tao') redirect('/category/robotics-iot');
  if (slug === 'thanh-tich') redirect('/category/bai-bao-khoa-hoc');
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const currentUser = session?.user;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const query = await searchParams;
  const categoryId = category.id;
  const pageSize = slug === 'bai-bao-khoa-hoc' ? 10 : 9;
  const searchQuery = query.q?.trim() ?? '';
  const requestedYear = Number(query.year);
  const year = Number.isInteger(requestedYear) && requestedYear >= 1900 && requestedYear <= 2100 ? requestedYear : undefined;
  const sort = ['newest', 'oldest', 'title'].includes(query.sort ?? '') ? query.sort! : 'featured';
  const filterParams = new URLSearchParams();
  if (searchQuery) filterParams.set('q', searchQuery);
  if (year) filterParams.set('year', String(year));
  if (sort !== 'featured') filterParams.set('sort', sort);
  const basePath = `/category/${slug}${filterParams.size ? `?${filterParams}` : ''}`;
  const hasFilters = !!(searchQuery || year || sort !== 'featured');
  const returnToKey = `${basePath}:${query.page ?? '1'}`;
  async function CategoryResults() {
    const { items, total: totalItems, totalPages, page } = await listPublications({ authenticated: !!currentUser, categoryId, q: searchQuery, year, sort: sort as 'featured' | 'newest' | 'oldest' | 'title', page: query.page, pageSize });
    const returnTo = basePath + (page > 1 ? (filterParams.size ? '&' : '?') + 'page=' + page : '');

    return <>
        {/* Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-lg border border-dashed border-slate-200">
            <Sparkles className="w-7 h-7 text-[#1F2937] mx-auto mb-2.5" />
            <h3 className="text-base font-semibold text-[#1F2937]">{hasFilters ? 'Không tìm thấy công trình phù hợp' : 'Chưa có công trình nào'}</h3>
            <p className="text-sm text-[#1F2937] mt-1 max-w-md mx-auto">
              {hasFilters ? 'Thử từ khóa khác hoặc bỏ điều kiện năm để xem thêm công trình.' : 'Chuyên mục này hiện chưa có bài viết xuất bản hoặc các bài viết đang được lưu hành nội bộ.'}
            </p>
          </div>
        ) : (
          <div>
            {slug === 'bai-bao-khoa-hoc' && (
              <div className="space-y-4">
                {items.map(item => {
                  const paperLink = item.links.find(link => link.type === 'PAPER_URL');
                  return (
                    <article key={item.id} className="clickable-card home-featured-card panel-public grid items-stretch gap-5 p-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="flex aspect-[4/3] min-w-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-[#FFFFFF] p-2 sm:aspect-auto">
                        <MediaImage src={item.thumbnailUrl} alt={`Hình minh họa nghiên cứu: ${item.title}`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                      </Link>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[#1F2937]">
                          <TypeBadge type={item.type} size="sm" variant="outline" />
                          {item.publishedYear && <span>{item.publishedYear}</span>}
                        </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>
                        <h2 className="mt-3 h-7 shrink-0 line-clamp-1 text-lg font-semibold leading-7 text-[#1F2937]" title={item.title}>
                          <Link href={showcaseHref(item.slug, returnTo)} className="hover:underline">{item.title}</Link>
                        </h2>
                        <p className="mt-2 truncate text-sm leading-6 text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>

                          {item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}
                        </p>
                        {item.issuer && <p className="mt-1 truncate text-xs italic leading-4 text-[#1F2937]">{item.issuer}</p>}
                        <p className="mb-3 mt-3 h-12 shrink-0 line-clamp-2 break-words text-sm leading-6 text-[#1F2937]">{item.summary}</p>
                        <div className="-mb-5 mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-200 py-1 text-sm sm:-mb-6">
                          <CitationModal item={toCitationDto(item)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[#1F2937] hover:underline" />
                          {paperLink && <a href={paperLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-[#1F2937] hover:underline">Bài báo gốc <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
                          <Link href={showcaseHref(item.slug, returnTo)} className="ml-auto inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#1F2937] hover:underline">Xem công trình <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* 2. SHOWCASE_GRID Layout */}
            {slug === 'robotics-iot' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const demoLink = item.links.find((l) => l.type === 'LIVE_DEMO');
                  const githubLink = item.links.find((l) => l.type === 'GITHUB');
                  return (
                    <article
                      key={item.id}
                      className="clickable-card home-featured-card panel-public !p-0 overflow-hidden flex flex-col"
                    >
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <div className="aspect-video shrink-0 relative overflow-hidden"><MediaImage
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy" decoding="async" className="w-full h-full object-cover"
                          /></div>

                      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <TypeBadge type={item.type} size="sm" variant="outline" />
                        </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>

                        <h2 className="mt-3 h-14 shrink-0 line-clamp-2 text-lg font-semibold leading-7 text-[#1F2937]">
                          <Link
                            href={showcaseHref(item.slug, returnTo)}
                            className="hover:text-[#1F2937] transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h2>

                        <p className="mt-2 h-6 shrink-0 truncate text-sm leading-6 text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>

                          {item.contributors.length > 0 ? item.contributors.map((c, index) => (
                            <span key={c.id}>
                              {c.user ? <Link href={`/members/${c.user.id}`} className="hover:text-[#1F2937]">{c.user.fullName}</Link> : c.externalName}

                              {index < item.contributors.length - 1 ? ', ' : ''}
                            </span>
                          )) : null}
                        </p>

                        <p className="mb-3 mt-3 h-12 shrink-0 line-clamp-2 break-words text-sm leading-6 text-[#1F2937]">
                          {item.summary}
                        </p>


                        <div className="-mb-5 mt-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-slate-200 py-1 text-sm sm:-mb-6">
                          <div className="flex items-center gap-2">
                            {demoLink && (
                              <a
                                href={demoLink.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Xem Live Demo"
                                className="p-1.5 rounded-md hover:bg-[#FFFFFF] text-[#1F2937]"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                            {githubLink && (
                              <a
                                href={githubLink.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Mã nguồn GitHub"
                                className="p-1.5 rounded-md hover:bg-[#FFFFFF] text-[#1F2937]"
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <Link
                            href={showcaseHref(item.slug, returnTo)}
                            className="ml-auto inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#1F2937] hover:underline"
                          >
                            <span>Xem chi tiết</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </div>
        )}
        {totalItems > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <p className="text-xs leading-6 text-[#1F2937]">
              Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} / {totalItems} công trình
              {totalPages > 1 && <span className="ml-2 border-l border-slate-200 pl-2">Trang {page}/{totalPages}</span>}
            </p>
            <MemberPagination page={page} totalPages={totalPages} basePath={basePath} ariaLabel="Phân trang công trình" />
          </div>
        )}
    </>;
  }

  return (
    <>


      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl flex-1">
        {/* Category Header */}
        <header className="mb-6">
          <Breadcrumbs items={[{ label: category.name }]} />
          <div>
            <div className="min-w-0">
              <span className="page-eyebrow">
                Chuyên mục công trình
              </span>
              <h1 className="page-title">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm text-[#1F2937] truncate max-w-3xl mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <PublicationNavigation currentHref={`/category/${slug}`} />
        </header>

        <SearchForm action={`/category/${slug}`} aria-label="Tìm kiếm và lọc công trình" className="mb-6 grid items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_8rem_11rem_auto]">
          <div className="min-w-0">
            <label htmlFor="category-search" className="text-xs font-semibold text-[#1F2937]">Tìm kiếm trong chuyên mục</label>
            <div className="relative mt-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F2937]" />
              <input id="category-search" type="search" name="q" defaultValue={searchQuery} placeholder="Tiêu đề, tác giả, từ khóa..." className="h-11 w-full rounded-lg border border-slate-200 bg-[#FFFFFF] pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]" />
            </div>
          </div>
          <div>
            <label htmlFor="category-year" className="text-xs font-semibold text-[#1F2937]">Năm thực hiện</label>
            <input id="category-year" type="text" inputMode="numeric" name="year" min={1900} max={2100} defaultValue={year ?? ''} placeholder="Tất cả" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#FFFFFF] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]" />
          </div>
          <div>
            <label htmlFor="category-sort" className="text-xs font-semibold text-[#1F2937]">Sắp xếp</label>
            <CustomSelect key={sort} id="category-sort" name="sort" defaultValue={sort} className="mt-2" options={[
              { value: 'featured', label: 'Ưu tiên nổi bật' },
              { value: 'newest', label: 'Mới nhất' },
              { value: 'oldest', label: 'Cũ nhất' },
              { value: 'title', label: 'Tiêu đề A–Z' },
            ]} />
          </div>
          <button type="submit" className="h-11 rounded-lg bg-brand-button px-5 text-sm font-semibold text-white transition hover:brightness-110">Áp dụng</button>
          {hasFilters && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 md:col-span-4">
            <p className="break-words text-xs text-[#1F2937]">Kết quả lọc công trình{searchQuery ? ` với “${searchQuery}”` : ''}{year ? ` · Năm ${year}` : ''}</p>
            <Link href={`/category/${slug}`} className="inline-flex min-h-9 items-center text-xs font-semibold text-[#1F2937] hover:underline">Xóa bộ lọc</Link>
          </div>}
        </SearchForm>

        <Suspense key={returnToKey} fallback={<LoadingCards />}><CategoryResults /></Suspense>
      </main>


    </>
  );
}
