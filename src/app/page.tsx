import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ShowcaseCard } from '@/components/showcase-card';
import { ItemType } from '@prisma/client';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-4">
            🚀 Câu Lạc Bộ Nexus — ĐH Khoa Học Tự Nhiên
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Nơi Trưng Bày Công Trình & Thành Tích
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tổng hợp bài báo khoa học, giải thưởng và các sản phẩm công nghệ tiên phong của các thế hệ thành viên CLB.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{totalPapers}</div>
              <div className="text-xs text-slate-500 font-medium">Bài Báo Khoa Học</div>
            </div>
            <div className="border-x border-slate-100">
              <div className="text-2xl font-bold text-emerald-600">{totalProjects}</div>
              <div className="text-xs text-slate-500 font-medium">Dự Án Công Nghệ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{totalAchievements}</div>
              <div className="text-xs text-slate-500 font-medium">Giải Thưởng / Cống Hiến</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Showcase Feed */}
      <main className="container mx-auto px-4 py-10 max-w-6xl flex-1">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !typeFilter ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả
            </a>
            <a
              href="/?type=RESEARCH_PAPER"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'RESEARCH_PAPER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Bài báo nghiên cứu
            </a>
            <a
              href="/?type=PROJECT"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'PROJECT' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Dự án công nghệ
            </a>
            <a
              href="/?type=ACHIEVEMENT"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'ACHIEVEMENT' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Thành tích & Cống hiến
            </a>
          </div>

          <form method="GET" action="/" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery || ''}
              placeholder="Tìm kiếm công trình..."
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
              Lọc
            </button>
          </form>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500">
            Chưa có công trình nào phù hợp với bộ lọc này.
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
