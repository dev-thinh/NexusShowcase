import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ShowcaseCard } from '@/components/showcase-card';
import { FeaturedFilmstrip } from '@/components/featured-filmstrip';
import { EmptyState } from '@/components/ui/empty-state';
import { ItemType } from '@prisma/client';
import {
  Sparkles,
  BookOpen,
  Code2,
  Trophy,
  Search,
  Layers,
  GraduationCap,
  Cpu,
  Brain,
  MessageSquare,
  Activity,
  Server,
} from 'lucide-react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; year?: string; q?: string; domain?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type as ItemType | undefined;
  const yearFilter = params.year ? parseInt(params.year) : undefined;
  const searchQuery = params.q;
  const domainFilter = params.domain;

  const whereClause: any = {
    status: 'PUBLISHED',
  };

  if (typeFilter && ['RESEARCH_PAPER', 'PROJECT', 'ACHIEVEMENT'].includes(typeFilter)) {
    whereClause.type = typeFilter;
  }
  if (yearFilter) {
    whereClause.publishedYear = yearFilter;
  }

  const andConditions: any[] = [];

  if (searchQuery) {
    andConditions.push({
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { summary: { contains: searchQuery, mode: 'insensitive' } },
      ],
    });
  }

  if (domainFilter) {
    const domainKeywordMap: Record<string, string[]> = {
      ai: ['AI', 'Transformer', 'CNN', 'Deep Learning', 'Thị giác', 'Vision', 'Khuôn mặt'],
      nlp: ['NLP', 'Ngôn ngữ', 'LLM', 'PhoLLM', 'Truy xuất', 'Retrieval', 'Văn bản'],
      medical: ['Y tế', 'MRI', 'Não', 'Bệnh viện', 'Chẩn đoán', 'Medical'],
      iot: ['IoT', 'Edge', 'Jetson', 'Nhúng', 'SmartLab', 'Phần cứng'],
      systems: ['Server', 'Hạ tầng', 'GPU', 'Web', 'Cơ sở', 'Cluster'],
    };

    const keywords = domainKeywordMap[domainFilter] || [domainFilter];
    andConditions.push({
      OR: keywords.flatMap((kw) => [
        { title: { contains: kw, mode: 'insensitive' } },
        { summary: { contains: kw, mode: 'insensitive' } },
      ]),
    });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  const [items, totalPapers, totalProjects, totalAchievements, pinnedItems] = await Promise.all([
    prisma.showcaseItem.findMany({
      where: whereClause,
      include: {
        contributors: {
          include: { user: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', type: 'RESEARCH_PAPER' } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', type: 'PROJECT' } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', type: 'ACHIEVEMENT' } }),
    prisma.showcaseItem.findMany({
      where: { status: 'PUBLISHED', isPinned: true },
      include: {
        contributors: {
          include: { user: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { pinnedAt: 'desc' },
      take: 10,
    }),
  ]);

  const needed = 10 - pinnedItems.length;
  let fillItems: typeof pinnedItems = [];
  if (needed > 0) {
    const pinnedIds = pinnedItems.map((item) => item.id);
    fillItems = await prisma.showcaseItem.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: pinnedIds },
      },
      include: {
        contributors: {
          include: { user: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
      take: needed,
    });
  }

  const featuredItems = [...pinnedItems, ...fillItems];

  const categories = [
    { type: undefined, label: 'Tất cả công trình', icon: Layers },
    { type: 'RESEARCH_PAPER', label: 'Bài báo nghiên cứu', icon: BookOpen },
    { type: 'PROJECT', label: 'Dự án công nghệ', icon: Code2 },
    { type: 'ACHIEVEMENT', label: 'Thành tích & Cống hiến', icon: Trophy },
  ];

  const domains = [
    { key: undefined, label: 'Tất cả lĩnh vực', icon: Sparkles },
    { key: 'ai', label: 'AI & Computer Vision', icon: Brain },
    { key: 'nlp', label: 'NLP & Large Language Models', icon: MessageSquare },
    { key: 'medical', label: 'Healthcare & Medical AI', icon: Activity },
    { key: 'iot', label: 'IoT & Edge Computing', icon: Cpu },
    { key: 'systems', label: 'Systems & Infrastructure', icon: Server },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/90 text-[#0F294A] text-xs sm:text-sm font-bold mb-5 shadow-2xs border border-blue-200">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Khoa Công Nghệ Thông Tin • ĐH Khoa Học Tự Nhiên - ĐHQG-HCM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight font-serif">
            Kho Lưu Trữ Công Trình &amp; Sáng Tạo Học Thuật
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Lưu trữ và công bố các công trình nghiên cứu khoa học xuất bản, dự án công nghệ và thành tích của sinh viên CLB Nexus.
          </p>

          {/* Institutional Stats Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mt-10 p-5 bg-white/95 rounded-2xl border border-slate-200 shadow-xs backdrop-blur-xs">
            <div className="p-3 text-center">
              <div className="text-3xl sm:text-4xl font-black text-[#0F294A] font-serif">{totalPapers}</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">Bài Báo Khoa Học</div>
            </div>
            <div className="p-3 text-center sm:border-x sm:border-slate-100 border-y sm:border-y-0 border-slate-100 py-4 sm:py-3">
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-serif">{totalProjects}</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">Dự Án Công Nghệ</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-3xl sm:text-4xl font-black text-amber-700 font-serif">{totalAchievements}</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">Giải Thưởng / Cống Hiến</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Showcase Filmstrip Reel */}
      <FeaturedFilmstrip items={featuredItems} />

      {/* Main Showcase Feed */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        {/* Filter Navigation Bar */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Pills Tabs */}
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => {
                const Icon = c.icon;
                const isActive = typeFilter === c.type;
                const searchParamsObj = new URLSearchParams();
                if (c.type) searchParamsObj.set('type', c.type);
                if (domainFilter) searchParamsObj.set('domain', domainFilter);
                if (searchQuery) searchParamsObj.set('q', searchQuery);
                const href = `/?${searchParamsObj.toString()}`;

                return (
                  <a
                    key={c.label}
                    href={href}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0F294A] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{c.label}</span>
                  </a>
                );
              })}
            </div>

            {/* Search Form */}
            <form method="GET" action="/" className="flex items-center gap-2">
              {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
              {domainFilter && <input type="hidden" name="domain" value={domainFilter} />}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery || ''}
                  placeholder="Tìm bài báo, dự án, tác giả..."
                  className="w-full sm:w-72 pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A] focus:border-transparent transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold bg-[#0F294A] hover:bg-[#1A3E6B] text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Tìm
              </button>
            </form>
          </div>

          {/* Research Domain Topics Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1.5">
              Lĩnh vực:
            </span>
            {domains.map((d) => {
              const Icon = d.icon;
              const isActive = domainFilter === d.key;
              const searchParamsObj = new URLSearchParams();
              if (typeFilter) searchParamsObj.set('type', typeFilter);
              if (d.key) searchParamsObj.set('domain', d.key);
              if (searchQuery) searchParamsObj.set('q', searchQuery);
              const href = `/?${searchParamsObj.toString()}`;

              return (
                <a
                  key={d.label}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-100 text-[#0F294A] border border-blue-300 font-bold'
                      : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{d.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Content Showcase Grid */}
        {items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy công trình nào"
            description="Không có bài báo hoặc dự án nào khớp với tiêu chí tìm kiếm hiện tại."
            actionLabel="Xóa bộ lọc tìm kiếm"
            actionHref="/"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
