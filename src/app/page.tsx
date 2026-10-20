import { CardAdminControls } from '@/components/card-admin-controls';
import { showcaseHref } from '@/lib/showcase-navigation';
import { MemberPagination } from '@/components/member-pagination';
import { CardLink } from '@/components/card-link';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession as auth } from '@/lib/session';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { HomeHero } from '@/components/home-hero';
import { EmptyState } from '@/components/ui/empty-state';
import { TypeBadge } from '@/components/ui/badge';
import { CitationModal } from '@/components/citation-modal';
import { publicUserSelect } from '@/lib/public-user';
import { MemberCard } from '@/components/member-card';
import type { MemberDirectoryEntry } from '@/lib/member-directory';
import {
  BookOpen,
  Search,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const isAuthenticated = !!session?.user;

  const params = await searchParams;
  const searchQuery = params.q?.trim();
  let returnTo = searchQuery ? `/?q=${encodeURIComponent(searchQuery)}` : '/';

  const baseWhere: Prisma.ShowcaseItemWhereInput = {
    status: 'PUBLISHED',
    ...(isAuthenticated ? {} : { visibility: 'PUBLIC' }),
  };

  // Search Results Mode
  if (searchQuery) {
    const pageSize = 10;
    const searchWhere: Prisma.ShowcaseItemWhereInput = {
        ...baseWhere,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { summary: { contains: searchQuery, mode: 'insensitive' } },
          { contributors: { some: { OR: [
            { user: { fullName: { contains: searchQuery, mode: 'insensitive' } } },
            { externalName: { contains: searchQuery, mode: 'insensitive' } },
          ] } } },
        ],
      };
    const totalItems = await prisma.showcaseItem.count({ where: searchWhere });
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const requestedPage = Number(params.page);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages) : 1;
    const searchPath = `/?q=${encodeURIComponent(searchQuery)}`;
    returnTo = `${searchPath}${page > 1 ? `&page=${page}` : ''}`;
    const searchItems = await prisma.showcaseItem.findMany({
      omit: { authorDraft: true },
      where: searchWhere,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });

    return (
      <div className="min-h-screen flex flex-col font-sans bg-background">
        <Navbar />
        <section className="border-b border-slate-200 bg-white py-8 sm:py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-[#0F294A]">Trang chủ / Tìm kiếm</Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thư viện công trình</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F294A] sm:text-4xl">Kết quả tìm kiếm</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Khám phá nghiên cứu khoa học và dự án Robotics &amp; IoT của CLB.</p>
            <form method="GET" action="/" role="search" aria-label="Tìm kiếm công trình" className="mt-6 flex max-w-3xl flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input type="search" name="q" defaultValue={searchQuery} aria-label="Từ khóa tìm kiếm" placeholder="Tìm kiếm bài báo, dự án robot, tác giả..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]" />
              </div>
              <button type="submit" className="h-12 rounded-xl bg-brand-button px-6 text-sm font-semibold text-white transition hover:brightness-110">Tìm kiếm</button>
            </form>
            <p className="mt-3 text-xs leading-5 text-slate-500">Tìm theo tiêu đề, tóm tắt hoặc tên tác giả.</p>
          </div>
        </section>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-semibold text-[#0F294A]">{totalItems} công trình cho “{searchQuery}”</h2>
              {totalItems > 0 && <p className="mt-1 text-xs text-slate-500">Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} / {totalItems} công trình · Mới nhất trước</p>}
            </div>
            <Link href="/" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">Xóa tìm kiếm</Link>
          </div>
          {totalItems === 0 ? (
            <EmptyState icon={Search} title="Không tìm thấy công trình nào" description="Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc tìm theo tên tác giả." actionLabel="Về trang chủ" actionHref="/" />
          ) : (
            <>
              <div className="space-y-4">
                {searchItems.map(item => {
                  const paperLink = item.links.find(link => link.type === 'PAPER_URL');
                  const sourceLink = paperLink ?? item.links.find(link => link.type === 'GITHUB');
                  return (
                    <article key={item.id} className="clickable-card panel-public grid gap-5 transition-shadow hover:shadow-md sm:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-7">
                      <CardLink slug={item.slug} returnTo={returnTo} />
                      <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="flex aspect-[4/3] items-center justify-center self-start overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {item.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4 text-slate-400"><BookOpen aria-hidden="true" className="h-9 w-9 stroke-[1.25]" /><span className="text-xs">CLB Robotics &amp; IoT</span></div>
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
                        <h3 className="mt-3 break-words text-lg font-semibold leading-snug text-[#0F294A] sm:text-xl"><Link href={showcaseHref(item.slug, returnTo)} className="hover:underline">{item.title}</Link></h3>
                        {item.contributors.length > 0 && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600"><span className="font-semibold">Tác giả: </span>{item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}</p>}
                        {item.issuer && <p className="mt-1 text-xs italic leading-5 text-slate-500">{item.issuer}</p>}
                        <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">{item.summary}</p>
                        <footer className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-100 pt-2">
                          <Link href={showcaseHref(item.slug, returnTo)} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#0F294A] hover:underline">Xem công trình <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                          <CitationModal item={item} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0F294A] hover:underline" />
                          {sourceLink && <a href={sourceLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 text-xs text-slate-600 hover:text-[#0F294A] hover:underline">{paperLink ? 'Bài báo gốc' : 'Mã nguồn'} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>}
                        </footer>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <p className="text-xs text-slate-500">Trang {page} / {totalPages} · 10 công trình mỗi trang</p>
                <MemberPagination page={page} totalPages={totalPages} basePath={searchPath} ariaLabel="Phân trang kết quả tìm kiếm" />
              </div>
            </>
          )}
        </main>
        <AcademicFooter />
      </div>
    );
  }

  const [featuredItems, members] = await Promise.all([
    prisma.showcaseItem.findMany({
      omit: { authorDraft: true },
      where: baseWhere,
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 3,
    }),
    prisma.user.findMany({
      where: { status: 'ACTIVE', deletedAt: null, role: { in: ['ADMIN', 'CORE_MEMBER', 'MEMBER'] } },
      select: {
        ...publicUserSelect,
        _count: { select: { contributions: { where: { item: baseWhere } } } },
      },
      orderBy: [{ contributions: { _count: 'desc' } }, { fullName: 'asc' }],
    }),
  ]);

  const rolePriority: Record<string, number> = { ADMIN: 0, CORE_MEMBER: 1, MEMBER: 2 };
  const keyMembers = [...members].sort((a, b) =>
    rolePriority[a.role] - rolePriority[b.role]
    || b._count.contributions - a._count.contributions
    || a.fullName.localeCompare(b.fullName, 'vi'),
  ).slice(0, 3);

  const directions = [
    { title: 'Trí tuệ nhân tạo & Thị giác máy tính', surface: 'border-[#cdd8df] bg-[#edf2f5]', description: 'Khám phá các mô hình học máy, nhận thức hình ảnh và ứng dụng AI trong hệ thống thông minh.' },
    { title: 'Robot tự hành & Điều khiển', surface: 'border-[#dfd4c5] bg-[#f5f0e8]', description: 'Nghiên cứu định vị, lập kế hoạch chuyển động và khả năng tương tác của robot với môi trường.' },
    { title: 'IoT & Hệ thống nhúng', surface: 'border-[#cfd8cb] bg-[#eef2eb]', description: 'Kết nối cảm biến, thiết kế thiết bị nhúng và phát triển các hệ thống thu thập dữ liệu thời gian thực.' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />
      <HomeHero />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-7xl flex-1 space-y-14 sm:space-y-16 scroll-mt-32" id="home-content">
        <section aria-labelledby="home-search-title" className="mx-auto max-w-2xl">
          <div className="mb-5 text-center">
            <h2 id="home-search-title" className="text-2xl font-semibold tracking-tight text-[#0F294A] sm:text-3xl">Khám phá kho công trình</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tìm bài nghiên cứu, dự án và tác giả trong CLB.</p>
          </div>
        <form
          id="home-search"
          method="GET"
          action="/"
          className="scroll-mt-40 mx-auto flex max-w-2xl flex-col items-stretch gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center"
          aria-label="Tìm kiếm công trình"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              name="q"
              aria-label="Từ khóa tìm kiếm"
              placeholder="Tìm kiếm bài báo, dự án robot, tác giả..."
              className="w-full rounded-xl bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 w-full shrink-0 cursor-pointer rounded-xl bg-brand-button px-5 text-sm font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] focus-visible:ring-offset-2 sm:w-auto"
          >
            Tìm kiếm
          </button>
        </form>
        </section>
        
        <section className="border-t border-slate-200 pt-10 sm:pt-12" aria-labelledby="featured-works-title">
          <h2 id="featured-works-title" className="text-2xl font-semibold tracking-tight text-[#0F294A] sm:text-3xl">Công trình nổi bật</h2>
          <div className="mt-6 grid gap-5">
            {featuredItems.length === 0 ? (
              <EmptyState title="Chưa có công trình nổi bật" description="Các công trình đã công bố sẽ xuất hiện tại đây." />
            ) : featuredItems.map(item => {
              const paperLink = item.links.find(link => link.type === 'PAPER_URL');
              const sourceLink = paperLink ?? item.links.find(link => link.type === 'GITHUB');
              return (
                <article key={item.id} className="clickable-card panel-public grid min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white !p-0 transition-shadow hover:shadow-md md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                  <CardLink slug={item.slug} returnTo={returnTo} />
                  <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="relative flex aspect-[4/3] min-w-0 items-center justify-center overflow-hidden border-b border-slate-200 bg-slate-50 md:aspect-auto md:min-h-56 md:border-b-0 md:border-r">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnailUrl} alt={`Hình minh họa: ${item.title}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-4" />
                    ) : (
                      <span className="text-center text-sm font-semibold tracking-wide text-slate-400">CLB Robotics &amp; IoT</span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-col px-5 py-4 sm:px-6 sm:py-5">
                    <header>
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-600">
                        <TypeBadge type={item.type} size="sm" variant="outline" />
                        {item.publishedYear && <span>Năm {item.publishedYear}</span>}
                      </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-[#0F294A] sm:text-xl" title={item.title}>
                        <Link href={showcaseHref(item.slug, returnTo)} className="hover:text-[#0F294A] focus-visible:underline">{item.title}</Link>
                      </h3>
                      {item.contributors.length > 0 && (
                        <p className="mt-1 truncate text-sm leading-relaxed text-slate-600" title={item.contributors.map(c => `${c.user?.fullName || c.externalName || ''}${c.role === 'ADVISOR' ? ' (GVHD)' : ''}`).join(', ')}>
                          <span className="font-semibold">Tác giả: </span>
                          {item.contributors.map((contributor, index) => (
                            <span key={contributor.id}>
                              {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="hover:text-[#0F294A]">{contributor.user.fullName}</Link> : contributor.externalName}
                              {contributor.role === 'ADVISOR' ? ' (GVHD)' : ''}
                              {index < item.contributors.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                      {item.issuer && <p className="mt-1 text-sm italic leading-relaxed text-slate-600">{item.issuer}</p>}
                    </header>
                    <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-600">{item.summary}</p>
                    <footer className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-1">
                      {sourceLink && (
                        <a href={sourceLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F294A] hover:underline">
                          {paperLink ? 'Bài báo gốc' : 'Mã nguồn'} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                      <CitationModal item={item} className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F294A] hover:underline" />
                      <Link href={showcaseHref(item.slug, returnTo)} className="ml-auto inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#0F294A] hover:underline">
                        Xem công trình <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </footer>
                  </div>
                </article>
              );
            })}

          </div>
        </section>

        <section className="border-t border-slate-200 pt-10 sm:pt-12" aria-labelledby="research-directions-title">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hướng nghiên cứu</p>
          <h2 id="research-directions-title" className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-[#0F294A] sm:text-3xl">
            Từ nghiên cứu đến hệ thống thông minh.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {directions.map(({ title, description, surface }) => (
              <article key={title} className={`rounded-xl border p-4 sm:p-5 ${surface}`}>
                <h3 className="text-sm font-semibold leading-6 text-[#0F294A] sm:text-base">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10 sm:pt-12" aria-labelledby="home-members-title">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Con người của CLB</p>
              <h2 id="home-members-title" className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Thành viên</h2>
              <p className="mt-3 text-sm text-slate-600">Cùng nghiên cứu, cùng xây dựng và chia sẻ tri thức.</p>
            </div>
            <Link href="/members" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#0F294A] transition-colors hover:bg-slate-50">
              Xem tất cả thành viên <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {keyMembers.map(member => (
                <MemberCard key={member.id} member={{ ...member, studentId: null } as MemberDirectoryEntry} group={member.role as MemberDirectoryEntry['role']} />
              ))}
            </div>
          ) : <p className="panel-public text-sm text-slate-600">Thông tin thành viên đang được cập nhật.</p>}
        </section>
      </main>
      <AcademicFooter />
    </div>
  );
}

