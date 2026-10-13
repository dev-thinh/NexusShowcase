import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ShowcaseCard } from '@/components/showcase-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ItemType } from '@prisma/client';
import { publicUserSelect } from '@/lib/public-user';
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
  const session = await auth();
  const isAuthenticated = !!session?.user;

  const params = await searchParams;
  const typeFilter = params.type as ItemType | undefined;
  const yearFilter = params.year ? parseInt(params.year) : undefined;
  const searchQuery = params.q;
  const domainFilter = params.domain;

  const whereClause: any = {
    status: 'PUBLISHED',
    ...(isAuthenticated ? {} : { visibility: 'PUBLIC' }),
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
        { tags: { has: searchQuery } },
      ],
    });
  }

  if (domainFilter) {
    const domainKeywordMap: Record<string, string[]> = {
      ai: ['AI', 'Transformer', 'CNN', 'Deep Learning', 'Thị giác', 'Vision', 'Khuôn mặt'],
      nlp: ['NLP', 'Ngôn ngữ', 'LLM', 'PhoLLM', 'Truy xuất', 'Retrieval', 'Văn bản'],
      medical: ['Y tế', 'MRI', 'Não', 'Bệnh viện', 'Chẩn đoán', 'Medical'],
      iot: ['IoT', 'Edge', 'Jetson', 'Nhúng', 'SmartLab', 'Phần cứng', 'Robotics'],
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

  const items = await prisma.showcaseItem.findMany({
    where: whereClause,
    include: {
      contributors: {
        include: { user: { select: publicUserSelect } },
        orderBy: { displayOrder: 'asc' },
      },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
  });

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
    { key: 'iot', label: 'IoT & Robotics', icon: Cpu },
    { key: 'systems', label: 'Systems & Infrastructure', icon: Server },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Navbar />

      {/* Compact Academic Header (Không chiếm diện tích, không rườm rà) */}
      <section className="relative overflow-hidden py-10 sm:py-14 border-b border-slate-100 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-slate-800 text-xs sm:text-sm font-semibold mb-3 shadow-2xs border border-slate-200">
            <GraduationCap className="w-4 h-4 text-[#0F294A]" />
            <span>CLB Nghiên cứu &amp; Sáng tạo Nexus • Khoa CNTT - ĐHKHTN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Kho Lưu Trữ Công Trình &amp; Sáng Tạo Học Thuật
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Lưu trữ và công bố các công trình nghiên cứu khoa học, dự án công nghệ, robot và tài nguyên học thuật của sinh viên.
          </p>
        </div>
      </section>

      {/* Main Showcase Feed: Trình bày ngay trên màn hình đầu tiên */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl flex-1">
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
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0F294A] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
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
                  placeholder="Tìm bài báo, dự án, robot, tác giả..."
                  className="w-full sm:w-72 pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-colors shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-bold bg-[#0F294A] hover:bg-[#1E3A5F] text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
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
