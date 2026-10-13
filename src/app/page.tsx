import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { EmptyState } from '@/components/ui/empty-state';
import { TypeBadge } from '@/components/ui/badge';
import { CitationModal } from '@/components/citation-modal';
import { publicUserSelect } from '@/lib/public-user';
import {
  BookOpen,
  Bot,
  Search,
  FileText,
  ExternalLink,
  ArrowRight,
  Database,
  Award,
  Github,
  Globe,
  Sparkles,
  Layers,
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
                    className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col gap-3.5"
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

                    <div className="flex flex-wrap items-center gap-3 pt-3.5 border-t border-slate-100">
                      <CitationModal
                        item={item}
                        className="h-8.5 px-3 rounded-lg bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                      />
                      {paperLink && (
                        <a
                          href={paperLink.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Bài báo gốc</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="ml-auto text-xs font-bold text-[#0F294A] hover:text-[#1E3A5F] inline-flex items-center gap-1 group"
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
  const [researchPapers, publishedPapersCount, roboticsProjects, activeProjectsCount] = await Promise.all([
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
    prisma.showcaseItem.findMany({
      where: {
        ...baseWhere,
        OR: [
          { type: 'PROJECT' },
          { category: { slug: 'robotics-iot' } },
          { tags: { hasSome: ['Robotics', 'IoT', 'Robot', 'Nhúng', 'Embedded'] } },
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
      orderBy: [{ isPinned: 'desc' }, { publishedYear: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.showcaseItem.count({
      where: {
        ...baseWhere,
        OR: [
          { type: 'PROJECT' },
          { category: { slug: 'robotics-iot' } },
          { tags: { hasSome: ['Robotics', 'IoT', 'Robot', 'Nhúng', 'Embedded'] } },
        ],
      },
    }),
  ]);

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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 max-w-5xl flex-1 space-y-12 sm:space-y-16">
        
        {/* KHỐI 1: Công Trình & Bài Báo Khoa Học Mới Xuất Bản */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Xuất bản khoa học
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  Công Trình &amp; Bài Báo Khoa Học Mới Xuất Bản
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Các nghiên cứu được công bố tại hội thảo và tạp chí khoa học chuyên ngành.
                </p>
              </div>
            </div>

            <Link
              href="/category/bai-bao-khoa-hoc"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F294A] hover:text-[#1E3A5F] transition-colors shrink-0 group self-start sm:self-auto"
            >
              <span>Xem tất cả bài báo ({publishedPapersCount})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {researchPapers.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              Chưa có bài báo khoa học nào được công bố công khai.
            </div>
          ) : (
            <div className="space-y-4">
              {researchPapers.map((item) => {
                const paperLink = item.links.find((l) => l.type === 'PAPER_URL');
                return (
                  <article
                    key={item.id}
                    className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col gap-3.5"
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

                    <div className="flex flex-wrap items-center gap-3 pt-3.5 border-t border-slate-100">
                      <CitationModal
                        item={item}
                        className="h-8.5 px-3 rounded-lg bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                      />
                      {paperLink && (
                        <a
                          href={paperLink.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Bài báo gốc</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="ml-auto text-xs font-bold text-[#0F294A] hover:text-[#1E3A5F] inline-flex items-center gap-1 group"
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
        </section>

        {/* KHỐI 2: Dự Án Robotics & Hệ Thống Nhúng Tiêu Biểu */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Phần cứng &amp; Tự động hóa
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  Dự Án Robotics &amp; Hệ Thống Nhúng Tiêu Biểu
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Robot tự hành, giải pháp vi điều khiển và thiết bị IoT thông minh của thành viên CLB.
                </p>
              </div>
            </div>

            <Link
              href="/category/robotics-iot"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F294A] hover:text-[#1E3A5F] transition-colors shrink-0 group self-start sm:self-auto"
            >
              <span>Xem tất cả dự án ({activeProjectsCount})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {roboticsProjects.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              Chưa có dự án kỹ thuật nào được công bố công khai.
            </div>
          ) : (
            <div className="space-y-4">
              {roboticsProjects.map((item) => {
                const demoLink = item.links.find((l) => l.type === 'LIVE_DEMO');
                const githubLink = item.links.find((l) => l.type === 'GITHUB');

                return (
                  <article
                    key={item.id}
                    className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col gap-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        Robotics &amp; IoT
                      </span>
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
                        <span className="text-slate-500 font-normal">Kỹ sư thực hiện: </span>
                        {item.contributors.map((c, idx) => (
                          <span key={c.id}>
                            {c.user?.fullName || c.externalName}
                            {idx < item.contributors.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-3.5 border-t border-slate-100">
                      {githubLink && (
                        <a
                          href={githubLink.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Github className="w-3.5 h-3.5 text-slate-700" />
                          <span>Mã nguồn</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      {demoLink && (
                        <a
                          href={demoLink.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Demo thực tế</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="ml-auto text-xs font-bold text-[#0F294A] hover:text-[#1E3A5F] inline-flex items-center gap-1 group"
                      >
                        <span>Xem chi tiết đề tài</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* KHỐI 3: Trung Tâm Dữ Liệu & Vinh Danh Thành Tích */}
        <section className="space-y-4 pt-2">
          <div className="pb-3 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Tài nguyên &amp; Cột mốc
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Tài Nguyên Khoa Học &amp; Bảng Vàng Vinh Danh
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hub 1: Tập Dữ Liệu & AI */}
            <Link
              href="/category/tap-du-lieu-ai"
              className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 hover:border-slate-300 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0F294A] transition-colors">
                  Tập Dữ Liệu &amp; AI Model Mở
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Các bộ dữ liệu học thuật, pre-trained model và công cụ mã nguồn mở phục vụ cộng đồng nghiên cứu.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0F294A]">
                <span>Khám phá kho dữ liệu</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Hub 2: Bảng Vàng Giải Thưởng */}
            <Link
              href="/category/vinh-danh-giai-thuong"
              className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 hover:border-slate-300 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0F294A] transition-colors">
                  Giải Thưởng &amp; Bảng Vàng Thành Tích
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ghi nhận các giải thưởng nghiên cứu khoa học, Olympic Tin học và cuộc thi công nghệ của sinh viên CLB.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0F294A]">
                <span>Xem bảng vinh danh</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

      </main>

      {/* Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
