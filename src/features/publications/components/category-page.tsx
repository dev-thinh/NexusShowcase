
import { getServerI18n } from '@/shared/i18n/server';
import { categoryPagePath } from '@/shared/lib/page-urls';
import { ConferenceCardBanner } from '@/features/publications/components/conference-card-banner';
import { PublicationCardMeta } from '@/features/publications/components/publication-card-meta';
import { PublicationCardDescription } from '@/features/publications/components/publication-card-description';
import { ContributorNames } from '@/features/publications/components/contributor-names';
import { CardResourceLink } from '@/features/publications/components/card-resource-link';
import { PublicationFilters } from '@/features/publications/components/publication-filters';
import { MediaImage } from '@/shared/ui/media-image';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getSession as auth } from '@/features/identity/server/session';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import { CardLink } from '@/features/publications/components/card-link';
import { CitationModal } from '@/features/publications/components/citation-modal';
import { toCitationDto } from '@/features/publications/model/contracts';
import { showcaseHref } from '@/features/publications/model/navigation';
import { listPublications } from '@/features/publications/server/queries';
import { prisma } from '@/server/db/prisma';
import { PublicationSkeleton } from '@/shared/ui/content-skeletons';
import { PaginationFooter } from '@/shared/ui/member-pagination';
import { ArrowRight, Sparkles } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';


export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; year?: string; sort?: string }>;
}) {
  const { t: tr } = await getServerI18n();

  const { slug } = await params;
  if (slug === 'du-an-sang-tao') redirect('/projects');
  if (slug === 'thanh-tich') redirect('/research');
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const currentUser = session?.user;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const categoryName = slug === 'robotics-iot' ? tr('Dự án & Sản phẩm') : slug === 'bai-bao-khoa-hoc' ? tr('Nghiên cứu khoa học') : category.name;
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
  const basePath = `${categoryPagePath(slug)}${filterParams.size ? `?${filterParams}` : ''}`;
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
            <h3 className="text-base font-semibold text-[#1F2937]">{hasFilters ? tr("Không tìm thấy công trình phù hợp") : tr("Chưa có công trình nào")}</h3>
            <p className="text-sm text-[#1F2937] mt-1 max-w-md mx-auto">
              {hasFilters ? tr("Thử từ khóa khác hoặc bỏ điều kiện năm để xem thêm công trình.") : tr("Chuyên mục này hiện chưa có bài viết xuất bản hoặc các bài viết đang được lưu hành nội bộ.")}
            </p>
          </div>
        ) : (
          <div>
            {slug === 'bai-bao-khoa-hoc' && (
              <div className="grid items-start gap-4">
                {items.map(item => {

                  return (
                    <article key={item.id} className="clickable-card publication-card home-featured-card panel-public flex min-w-0 flex-col overflow-hidden !p-0">
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <ConferenceCardBanner value={item.conference} />
                      <div className="publication-card__content grid min-w-0 items-stretch gap-5 p-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
                        <Link href={showcaseHref(item.slug, returnTo)} aria-label={tr("Xem công trình: {0}", item.title)} className="publication-card__media relative flex aspect-[4/3] min-w-0 items-center justify-center overflow-hidden rounded-lg">
                          <MediaImage src={item.thumbnailUrl} alt={tr("Hình minh họa nghiên cứu: {0}", item.title)} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full rounded-lg object-cover" />
                        </Link>
                        <div className="publication-card__body flex min-w-0 flex-col">
                          <PublicationCardMeta type={item.type} year={item.publishedYear}>
                            {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                          </PublicationCardMeta>
                          <h2 className="publication-card__title" title={item.title}>
                            <Link href={showcaseHref(item.slug, returnTo)} className="hover:underline">{item.title}</Link>
                          </h2>
                          <p className="mt-2 h-6 shrink-0 truncate text-sm leading-6 text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>

                            <ContributorNames contributors={item.contributors} />
                          </p>
                          <PublicationCardDescription summary={item.summary} className="mb-2 mt-2" />
                          <div className="publication-card__footer -mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-200 py-1 text-sm sm:-mb-6">
                            <CitationModal triggerVariant="icon" item={toCitationDto(item)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[#1F2937] hover:underline" />
                            <CardResourceLink links={item.links} detailHref={showcaseHref(item.slug, returnTo)} />
                            <Link href={showcaseHref(item.slug, returnTo)} className="ml-auto inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#1F2937] hover:underline">{tr("Xem công trình") + " "}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* 2. SHOWCASE_GRID Layout */}
            {slug === 'robotics-iot' && (
              <div className="grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {


                  return (
                    <article
                      key={item.id}
                      className="clickable-card publication-card home-featured-card panel-public !p-0 overflow-hidden flex flex-col"
                    >
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <ConferenceCardBanner value={item.conference} />
                      <div className="publication-card__content flex min-w-0 flex-col">
                      <div className="publication-card__media shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
                        <div className="publication-cover-frame relative aspect-[4/3] overflow-hidden rounded-lg">
                          <MediaImage
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy" decoding="async" className="h-full w-full rounded-lg border-0 object-cover"
                          />
                        </div>
                      </div>

                      <div className="publication-card__body flex min-w-0 flex-col p-5 sm:p-6">
                        <PublicationCardMeta type={item.type} year={item.publishedYear}>
                          {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                        </PublicationCardMeta>
                        <h2 className="publication-card__title" title={item.title}>
                          <Link
                            href={showcaseHref(item.slug, returnTo)}
                            className="hover:text-[#1F2937] transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h2>

                        <p className="mt-2 h-6 shrink-0 truncate text-sm leading-6 text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>

                          <ContributorNames contributors={item.contributors} />
                        </p>

                        <PublicationCardDescription summary={item.summary} className="mb-2 mt-2" />


                        <div className="publication-card__footer -mb-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-slate-200 py-1 text-sm sm:-mb-6">
                          <CitationModal triggerVariant="icon" item={toCitationDto(item)} className="inline-flex min-h-9 shrink-0 items-center text-sm font-semibold text-[#1F2937] hover:underline" />
                          <CardResourceLink links={item.links} detailHref={showcaseHref(item.slug, returnTo)} />

                          <Link
                            href={showcaseHref(item.slug, returnTo)}
                            className="ml-auto inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#1F2937] hover:underline"
                          >
                            <span>{tr("Xem chi tiết")}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
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
          <PaginationFooter page={page} totalPages={totalPages} pageSize={pageSize} basePath={basePath} ariaLabel={tr("Phân trang công trình")} />
        )}
    </>;
  }

  return (
    <>


      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl flex-1">
        {/* Category Header */}
        <header className="mb-6">
          <Breadcrumbs items={[{ label: categoryName }]} />
          <div>
            <div className="min-w-0">
              <span className="page-eyebrow">{tr("Chuyên mục công trình")}</span>
              <h1 className="page-title">
                {categoryName}
              </h1>
              {category.description && (
                <p className="text-sm text-[#1F2937] truncate max-w-3xl mt-1">
                  {tr(category.description)}
                </p>
              )}
            </div>
          </div>
        </header>

        <PublicationFilters action={categoryPagePath(slug)} searchLabel={tr("Tìm kiếm trong chuyên mục")} searchQuery={searchQuery} year={year} sort={sort} defaultSort="featured" hasFilters={hasFilters} />

        <Suspense key={returnToKey} fallback={<PublicationSkeleton variant={slug === 'bai-bao-khoa-hoc' ? 'research' : 'projects'} />}><CategoryResults /></Suspense>
      </main>


    </>
  );
}
