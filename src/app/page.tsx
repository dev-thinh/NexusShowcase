import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ShowcaseCard } from '@/components/showcase-card';
import { ItemType } from '@prisma/client';
import {
  Sparkles,
  BookOpen,
  Code2,
  Trophy,
  Search,
  SlidersHorizontal,
  Layers,
  Inbox,
  RotateCcw,
} from 'lucide-react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; year?: string; q?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type as ItemType | undefined;
  const yearFilter = params.year ? parseInt(params.year) : undefined;
  const searchQuery = params.q;

  const whereClause: any = {
    status: 'PUBLISHED',
  };

  if (typeFilter && ['RESEARCH_PAPER', 'PROJECT', 'ACHIEVEMENT'].includes(typeFilter)) {
    whereClause.type = typeFilter;
  }
  if (yearFilter) {
    whereClause.publishedYear = yearFilter;
  }
  if (searchQuery) {
    whereClause.OR = [
      { title: { contains: searchQuery } },
      { summary: { contains: searchQuery } },
    ];
  }

  const [items, totalPapers, totalProjects, totalAchievements] = await Promise.all([
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
  ]);

  const categories = [
    { type: undefined, label: 'Tất cả công trình', icon: Layers },
    { type: 'RESEARCH_PAPER', label: 'Bài báo nghiên cứu', icon: BookOpen },
    { type: 'PROJECT', label: 'Dự án công nghệ', icon: Code2 },
    { type: 'ACHIEVEMENT', label: 'Thành tích & Cống hiến', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/50 to-slate-50 py-16 sm:py-20 border-b border-slate-200/80">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold mb-5 shadow-xs border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Câu Lạc Bộ Nexus • ĐH Khoa Học Tự Nhiên - ĐHQG-HCM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Nơi Trưng Bày Nghiên Cứu &amp; Sáng Tạo
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Kho lưu trữ các bài báo khoa học xuất bản, dự án công nghệ tiên phong và thành tích/cống hiến của các thế hệ thành viên CLB.
          </p>

          {/* Institutional Stats Counters */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto mt-10 p-3 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <div className="p-2 sm:p-3 text-center">
              <div className="text-2xl sm:text-3xl font-black text-blue-700">{totalPapers}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Bài Báo Khoa Học</div>
            </div>
            <div className="p-2 sm:p-3 text-center border-x border-slate-100">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">{totalProjects}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Dự Án Công Nghệ</div>
            </div>
            <div className="p-2 sm:p-3 text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-600">{totalAchievements}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Giải Thưởng / Cống Hiến</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Showcase Feed */}
      <main className="container mx-auto px-4 py-10 max-w-6xl flex-1">
        {/* Filter Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          {/* Pills Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const isActive = typeFilter === c.type;
              const href = c.type ? `/?type=${c.type}` : '/';

              return (
                <a
                  key={c.label}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </a>
              );
            })}
          </div>

          {/* Search Form */}
          <form method="GET" action="/" className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery || ''}
                placeholder="Tìm bài báo, dự án..."
                className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors w-48 sm:w-64"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Content Showcase Grid */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy công trình nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Không có bài báo hoặc dự án nào khớp với tiêu chí tìm kiếm hiện tại.
            </p>
            <a
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
