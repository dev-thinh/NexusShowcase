import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { EmptyState } from '@/components/ui/empty-state';
import { TypeBadge } from '@/components/ui/badge';
import { CitationModal } from '@/components/citation-modal';
import { publicUserSelect } from '@/lib/public-user';
import { buildHomepageCategoryWhere } from '@/lib/home-section-filters';
import {
  BookOpen,
  Search,
  FileText,
  ExternalLink,
  ArrowRight,
  Github,
  Globe,
  Cpu,
} from 'lucide-react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  const params = await searchParams;
  const searchQuery = params.q?.trim();

  const baseWhere: any = {
    status: 'PUBLISHED',
    ...(isAuthenticated ? {} : { visibility: 'PUBLIC' }),
  };

  // Search Results Mode
  if (searchQuery) {
    const searchItems = await prisma.showcaseItem.findMany({
      where: {
        ...baseWhere,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { summary: { contains: searchQuery, mode: 'insensitive' } },
          { tags: { has: searchQuery } },
        ],
      },
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
    });

    return (
      <div className="min-h-screen flex flex-col font-sans bg-white">
        <Navbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-10 sm:py-14 border-b border-slate-100 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center relative z-10">
            {/* Tech-badge Panel */}
            <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-3.5 p-2 pr-4 sm:pr-5 rounded-xl bg-white border border-slate-200 shadow-xs mb-5 sm:mb-6">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs sm:text-sm font-bold tracking-wide shadow-2xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Robotics &amp; IoT Lab</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-slate-200" />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-tight">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Nghiên Cứu Khoa Học &amp; Công Nghệ Robotics · IoT
            </h1>

            <p className="mt-3.5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Không gian công bố các công trình nghiên cứu khoa học xuất bản, hệ thống nhúng thông minh và dự án robot của thành viên CLB Robotics &amp; IoT HCMUS.
            </p>

            {/* Central Search Form */}
            <form method="GET" action="/" className="mt-6 max-w-xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Tìm kiếm bài báo, dự án robot, tác giả..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-colors shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold bg-[#0F294A] hover:bg-[#1E3A5F] text-white rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        </section>

        {/* Search Results Feed */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-5xl flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kết quả tìm kiếm
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                Tìm thấy {searchItems.length} công trình cho &quot;{searchQuery}&quot;
              </h2>
            </div>
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            >
              Xóa tìm kiếm
            </Link>
          </div>

          {searchItems.length === 0 ? (
            <EmptyState
              title="Không tìm thấy công trình nào"
              description={`Không có bài báo hoặc dự án nào khớp với từ khóa "${searchQuery}".`}
              actionLabel="Xem toàn bộ chuyên mục"
              actionHref="/"
            />
          ) : (
            <div className="space-y-4">
              {searchItems.map((item) => {
                const paperLink = item.links.find((l) => l.type === 'PAPER_URL');
                return (
                  <article
                    key={item.id}
                    className="panel-public hover:border-slate-300 hover:shadow-xs transition-all flex flex-col gap-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <TypeBadge type={item.type} size="sm" />
                      {item.publishedYear && (
                        <>
                          <span>•</span>
                          <span>Năm {item.publishedYear}</span>
                        </>
                      )}
                      {item.issuer && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 font-medium">{item.issuer}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="hover:text-[#0F294A] transition-colors"
                      >
                        {item.title}
                      </Link>
                    </h3>

                    {item.contributors.length > 0 && (
                      <p className="text-xs sm:text-sm text-slate-700 font-medium">
                        <span className="text-slate-500 font-normal">Tác giả: </span>
                        {item.contributors.map((c, idx) => (
                          <span key={c.id}>
                            {c.user?.fullName || c.externalName}
                            {c.role === 'ADVISOR' ? ' (GVHD)' : ''}
                            {idx < item.contributors.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="action-row-card">
                      <CitationModal
                        item={item}
                        className="action-primary-card"
                      />
                      {paperLink && (
                        <a
                          href={paperLink.url}
                          target="_blank"
                          rel="noreferrer"
                          className="action-secondary-card"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Bài báo gốc</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="action-secondary-card ml-auto group"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <AcademicFooter />
      </div>
    );
  }

  // Portal Mode (Default Homepage)
  const [
    researchPapers,
    publishedPapersCount,
    roboticsProjects,
    activeProjectsCount,
    creativeProjects,
    creativeCount,
  ] = await Promise.all([
    // 1. Research Papers
    prisma.showcaseItem.findMany({
      where: {
        ...baseWhere,
        OR: [
          { type: 'RESEARCH_PAPER' },
          { category: { slug: 'bai-bao-khoa-hoc' } },
        ],
      },
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.showcaseItem.count({
      where: {
        ...baseWhere,
        OR: [
          { type: 'RESEARCH_PAPER' },
          { category: { slug: 'bai-bao-khoa-hoc' } },
        ],
      },
    }),
    // 2. Robotics & IoT Projects
    prisma.showcaseItem.findMany({
      where: buildHomepageCategoryWhere('robotics-iot', baseWhere),
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { publishedYear: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.showcaseItem.count({
      where: buildHomepageCategoryWhere('robotics-iot', baseWhere),
    }),
    // 3. Creative & Other Projects
    prisma.showcaseItem.findMany({
      where: buildHomepageCategoryWhere('du-an-sang-tao', baseWhere),
      include: {
        contributors: {
          include: { user: { select: publicUserSelect } },
          orderBy: { displayOrder: 'asc' },
        },
        links: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { publishedYear: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.showcaseItem.count({
      where: buildHomepageCategoryWhere('du-an-sang-tao', baseWhere),
    }),
  ]);

  // Reusable Project Card Renderer (for Block 2 & Block 3)
  const renderProjectCard = (item: any) => {
    const demoLink = item.links?.find((l: any) => l.type === 'LIVE_DEMO');
    const githubLink = item.links?.find((l: any) => l.type === 'GITHUB');

    return (
      <article
        key={item.id}
        className="panel-public p-0 overflow-hidden hover:border-slate-300 hover:shadow-xs transition-all flex flex-col group"
      >
        {item.thumbnailUrl ? (
          <div className="aspect-[16/10] w-full bg-slate-100 relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-24 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <Cpu className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Mô hình kỹ thuật Lab</span>
          </div>
        )}

        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <TypeBadge type={item.type} size="sm" />
            {item.publishedYear && (
              <>
                <span>•</span>
                <span>Năm {item.publishedYear}</span>
              </>
            )}
            {item.issuer && (
              <>
                <span>•</span>
                <span className="text-slate-700 font-medium truncate max-w-[140px]">{item.issuer}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
            <Link
              href={`/showcase/${item.slug}`}
              className="hover:text-[#0F294A] transition-colors"
            >
              {item.title}
            </Link>
          </h3>

          {/* Engineers / Contributors */}
          {item.contributors.length > 0 && (
            <p className="text-xs text-slate-700 font-medium mb-2 truncate">
              <span className="text-slate-500 font-normal">Kỹ sư: </span>
              {item.contributors.map((c: any, idx: number) => (
                <span key={c.id}>
                  {c.user?.fullName || c.externalName}
                  {idx < item.contributors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}

          {/* Summary */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1">
            {item.summary}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {item.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5">
              {githubLink && (
                <a
                  href={githubLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-semibold"
                  title="Mã nguồn GitHub"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </a>
              )}
              {demoLink && (
                <a
                  href={demoLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 font-semibold"
                  title="Demo thực tế"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Demo</span>
                </a>
              )}
            </div>

            <Link
              href={`/showcase/${item.slug}`}
              className="text-xs font-bold text-[#0F294A] hover:text-[#1E3A5F] inline-flex items-center gap-1 ml-auto group/btn"
            >
              <span>Chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 sm:py-14 border-b border-slate-100 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center relative z-10">
          {/* Tech-badge Panel */}
          <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-3.5 p-2 pr-4 sm:pr-5 rounded-xl bg-white border border-slate-200 shadow-xs mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs sm:text-sm font-bold tracking-wide shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Robotics &amp; IoT Lab</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-slate-200" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-tight">
              Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Nghiên Cứu Khoa Học &amp; Công Nghệ Robotics · IoT
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Không gian công bố các công trình nghiên cứu khoa học xuất bản, hệ thống nhúng thông minh và dự án robot của thành viên CLB Robotics &amp; IoT HCMUS.
          </p>

          {/* Central Search Form */}
          <form method="GET" action="/" className="mt-7 max-w-xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="q"
                placeholder="Tìm kiếm bài báo, dự án robot, tác giả..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-colors shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold bg-[#0F294A] hover:bg-[#1E3A5F] text-white rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      {/* Main Academic Portal Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-6xl flex-1 space-y-14 sm:space-y-16">
        
        {/* PHÂN KHU 1: NGHIÊN CỨU KHOA HỌC (Layout Ngang: Bất đối xứng 2 cột Trái - Phải) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start pb-12 sm:pb-16 border-b border-slate-200">
          {/* Cột Trái (lg:col-span-4): Tiêu đề, Định hướng & Link xem tất cả */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>Xuất bản khoa học</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Công Trình &amp; Bài Báo Khoa Học Mới Xuất Bản
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Các công trình nghiên cứu khoa học của thành viên Lab được công bố tại các hội thảo và tạp chí chuyên ngành uy tín trong nước và quốc tế.
            </p>

            <div className="pt-2">
              <Link
                href="/category/bai-bao-khoa-hoc"
                data-home-view-all
                className="action-primary-card group"
              >
                <span>Xem tất cả ({publishedPapersCount})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Cột Phải (lg:col-span-8): Danh sách bài báo theo Card Ngang học thuật */}
          <div className="lg:col-span-8 space-y-4">
            {researchPapers.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                Chưa có bài báo khoa học nào được công bố công khai.
              </div>
            ) : (
              researchPapers.map((item) => {
                const paperLink = item.links?.find((l: any) => l.type === 'PAPER_URL');
                return (
                  <article
                    key={item.id}
                    className="panel-public hover:border-slate-300 hover:shadow-xs transition-all flex flex-col gap-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <TypeBadge type={item.type} size="sm" />
                      {item.publishedYear && (
                        <>
                          <span>•</span>
                          <span>Năm {item.publishedYear}</span>
                        </>
                      )}
                      {item.issuer && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 font-medium">{item.issuer}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="hover:text-[#0F294A] transition-colors"
                      >
                        {item.title}
                      </Link>
                    </h3>

                    {item.contributors.length > 0 && (
                      <p className="text-xs sm:text-sm text-slate-700 font-medium">
                        <span className="text-slate-500 font-normal">Tác giả: </span>
                        {item.contributors.map((c: any, idx: number) => (
                          <span key={c.id}>
                            {c.user?.fullName || c.externalName}
                            {c.role === 'ADVISOR' ? ' (GVHD)' : ''}
                            {idx < item.contributors.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="action-row-card">
                      <CitationModal
                        item={item}
                        className="action-primary-card"
                      />
                      {paperLink && (
                        <a
                          href={paperLink.url}
                          target="_blank"
                          rel="noreferrer"
                          className="action-secondary-card"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Bài báo gốc</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="action-secondary-card ml-auto group"
                      >
                        <span>Xem chi tiết đề tài</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* PHÂN KHU 2: ROBOTICS & IOT (Layout Dọc: Tiêu đề trên - Lưới Card dưới) */}
        <section className="space-y-6 pb-12 sm:pb-16 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Phần cứng &amp; Tự động hóa
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  Dự Án Robotics &amp; Hệ Thống Nhúng Tiêu Biểu
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Robot tự hành, giải pháp vi điều khiển và thiết bị IoT thông minh do thành viên CLB chế tạo.
                </p>
              </div>
            </div>

            <Link
              href="/category/robotics-iot"
              data-home-view-all
              className="action-primary-card group shrink-0 self-start sm:self-auto"
            >
              <span>Xem tất cả ({activeProjectsCount})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {roboticsProjects.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              Chưa có dự án kỹ thuật nào được công bố công khai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {roboticsProjects.map((item) => renderProjectCard(item))}
            </div>
          )}
        </section>

        {/* PHÂN KHU 3: DỰ ÁN & SÁNG TẠO (Layout Dọc: Tiêu đề trên - Lưới Card dưới) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Đổi mới &amp; Ứng dụng
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  Dự Án Sáng Tạo &amp; Giải Pháp Khác
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Các sản phẩm phần mềm, sáng kiến công nghệ ứng dụng và giải pháp sáng tạo của sinh viên.
                </p>
              </div>
            </div>

            {creativeCount > 0 && (
              <Link
                href="/category/du-an-sang-tao"
                data-home-view-all
                className="action-primary-card group shrink-0 self-start sm:self-auto"
              >
                <span>Xem tất cả ({creativeCount})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {creativeProjects.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              Chưa có công trình sáng tạo nào được công bố công khai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creativeProjects.map((item) => renderProjectCard(item))}
            </div>
          )}
        </section>

      </main>

      {/* Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
