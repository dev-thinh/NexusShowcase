import { Suspense } from 'react';
import { LoadingCards } from '@/components/loading-content';
import { CardAdminControls } from '@/components/card-admin-controls';
import { CustomSelect } from '@/components/ui/custom-select';
import type { Prisma } from '@prisma/client';
import { showcaseHref } from '@/lib/showcase-navigation';
import { CardLink } from '@/components/card-link';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession as auth } from '@/lib/session';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { CitationModal } from '@/components/citation-modal';
import { TypeBadge } from '@/components/ui/badge';
import { publicUserSelect } from '@/lib/public-user';
import { Github, Globe, ArrowRight, ExternalLink, FolderGit2, Sparkles, Search, ChartNoAxesCombined } from 'lucide-react';
import { MemberPagination } from '@/components/member-pagination';

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
  const where: Prisma.ShowcaseItemWhereInput = {
    categoryId: category.id,
    ...(year ? { publishedYear: year } : {}),
    ...(searchQuery ? { OR: [
      { title: { contains: searchQuery, mode: 'insensitive' as const } },
      { summary: { contains: searchQuery, mode: 'insensitive' as const } },
      { contributors: { some: { OR: [
        { user: { fullName: { contains: searchQuery, mode: 'insensitive' as const } } },
        { externalName: { contains: searchQuery, mode: 'insensitive' as const } },
      ] } } },
    ] } : {}),
    status: 'PUBLISHED' as const,
    ...(currentUser ? {} : { visibility: 'PUBLIC' as const }),
  };
  const returnToKey = `${basePath}:${query.page ?? '1'}`;
  async function CategoryResults() {
    const totalItems = await prisma.showcaseItem.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const requestedPage = Number(query.page);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
    const returnTo = `${basePath}${page > 1 ? `${filterParams.size ? '&' : '?'}page=${page}` : ''}`;
    const items = await prisma.showcaseItem.findMany({
        omit: { authorDraft: true },
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
        attachments: true,
      },
      orderBy: sort === 'title'
        ? [{ title: 'asc' }, { id: 'asc' }]
        : sort === 'oldest'
          ? [{ publishedYear: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
          : sort === 'newest'
            ? [{ publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }]
            : [{ isPinned: 'desc' }, { publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });

    return <>
        {/* Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-lg border border-dashed border-slate-300">
            <Sparkles className="w-7 h-7 text-slate-400 mx-auto mb-2.5" />
            <h3 className="text-base font-semibold text-slate-700">{hasFilters ? 'Không tìm thấy công trình phù hợp' : 'Chưa có công trình nào'}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
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
                    <article key={item.id} className="clickable-card panel-public grid items-center gap-x-7 gap-y-5 px-5 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:px-6 sm:py-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-8">
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="flex aspect-[4/3] items-center justify-center self-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                        {item.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnailUrl} alt={`Hình minh họa nghiên cứu: ${item.title}`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <ChartNoAxesCombined className="h-9 w-9 stroke-[1.25]" aria-hidden="true" />
                            <span className="text-xs">Hình minh họa nghiên cứu</span>
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
                          <TypeBadge type={item.type} size="sm" variant="outline" />
                          {item.publishedYear && <span>{item.publishedYear}</span>}
                        </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>
                        <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-relaxed text-[#0F294A]" title={item.title}>
                          <Link href={showcaseHref(item.slug, returnTo)} className="hover:underline">{item.title}</Link>
                        </h2>
                        <p className="mt-2 truncate text-sm leading-6 text-slate-600" title={item.contributors.map(c => c.user?.fullName || c.externalName).join(', ')}>
                          <span className="font-semibold">Tác giả: </span>{item.contributors.map(c => c.user?.fullName || c.externalName).join(', ')}
                        </p>
                        {item.issuer && <p className="mt-2 truncate text-xs italic text-slate-500">{item.issuer}</p>}
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-100 pt-2 text-xs">
                          <Link href={showcaseHref(item.slug, returnTo)} className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#0F294A] hover:underline">Xem công trình <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                          <CitationModal item={item} className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-slate-600 hover:underline" />
                          {paperLink && <a href={paperLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-slate-600 hover:underline">Bài báo gốc <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
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
                      className="clickable-card panel-public !p-0 overflow-hidden hover:border-slate-300 transition-all flex flex-col"
                    >
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      {item.thumbnailUrl ? (
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy" decoding="async" className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                          <FolderGit2 className="w-10 h-10 stroke-[1.5]" />
                        </div>
                      )}

                      <div className="px-4 py-4 flex-1 flex flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <TypeBadge type={item.type} variant="outline" />
                        </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>

                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2 mb-2">
                          <Link
                            href={showcaseHref(item.slug, returnTo)}
                            className="hover:text-blue-800 transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h2>

                        <p className="mb-2 truncate text-xs leading-5 text-slate-600" title={item.contributors.map(c => `${c.user?.fullName || c.externalName || ''}${c.role === 'ADVISOR' ? ' (GVHD)' : ''}`).join(', ')}>
                          <span className="font-semibold">Tác giả: </span>
                          {item.contributors.length > 0 ? item.contributors.map((c, index) => (
                            <span key={c.id}>
                              {c.user ? <Link href={`/members/${c.user.id}`} className="hover:text-[#0F294A]">{c.user.fullName}</Link> : c.externalName}
                              {c.role === 'ADVISOR' ? ' (GVHD)' : ''}
                              {index < item.contributors.length - 1 ? ', ' : ''}
                            </span>
                          )) : 'Đang cập nhật'}
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-2 flex-1">
                          {item.summary}
                        </p>


                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            {demoLink && (
                              <a
                                href={demoLink.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Xem Live Demo"
                                className="p-1.5 rounded-md hover:bg-slate-100 text-emerald-600"
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
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-800"
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <Link
                            href={showcaseHref(item.slug, returnTo)}
                            className="text-[#0F294A] hover:underline inline-flex items-center gap-1 font-semibold"
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
            <p className="text-xs leading-6 text-slate-500">
              Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} / {totalItems} công trình
              {totalPages > 1 && <span className="ml-2 border-l border-slate-200 pl-2">Trang {page}/{totalPages}</span>}
            </p>
            <MemberPagination page={page} totalPages={totalPages} basePath={basePath} ariaLabel="Phân trang công trình" />
          </div>
        )}
    </>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl flex-1">
        {/* Category Header */}
        <header className="mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Chuyên mục công trình
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight tracking-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm text-slate-600 truncate max-w-3xl mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </header>

        <form method="GET" action={`/category/${slug}`} aria-label="Tìm kiếm và lọc công trình" className="mb-6 grid items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_8rem_11rem_auto]">
          <div className="min-w-0">
            <label htmlFor="category-search" className="text-xs font-semibold text-slate-700">Tìm kiếm trong chuyên mục</label>
            <div className="relative mt-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="category-search" type="search" name="q" defaultValue={searchQuery} placeholder="Tiêu đề, tác giả, từ khóa..." className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A]" />
            </div>
          </div>
          <div>
            <label htmlFor="category-year" className="text-xs font-semibold text-slate-700">Năm thực hiện</label>
            <input id="category-year" type="number" name="year" min={1900} max={2100} defaultValue={year ?? ''} placeholder="Tất cả" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A]" />
          </div>
          <div>
            <label htmlFor="category-sort" className="text-xs font-semibold text-slate-700">Sắp xếp</label>
            <CustomSelect key={sort} id="category-sort" name="sort" defaultValue={sort} className="mt-2" options={[
              { value: 'featured', label: 'Ưu tiên nổi bật' },
              { value: 'newest', label: 'Mới nhất' },
              { value: 'oldest', label: 'Cũ nhất' },
              { value: 'title', label: 'Tiêu đề A–Z' },
            ]} />
          </div>
          <button type="submit" className="h-11 rounded-lg bg-brand-button px-5 text-sm font-semibold text-white transition hover:brightness-110">Áp dụng</button>
          {hasFilters && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 md:col-span-4">
            <p className="break-words text-xs text-slate-500">Kết quả lọc công trình{searchQuery ? ` với “${searchQuery}”` : ''}{year ? ` · Năm ${year}` : ''}</p>
            <Link href={`/category/${slug}`} className="inline-flex min-h-9 items-center text-xs font-semibold text-[#0F294A] hover:underline">Xóa bộ lọc</Link>
          </div>}
        </form>

        <Suspense key={returnToKey} fallback={<LoadingCards />}><CategoryResults /></Suspense>
      </main>

      <AcademicFooter />
    </div>
  );
}
