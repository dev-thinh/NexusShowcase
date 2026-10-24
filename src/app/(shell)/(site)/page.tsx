import { HomeFeaturedSection, HomeMembersSection, HomeMomentsSection, HomeResearchSection } from './home-sections';
import { HomeHero } from '@/features/publications/components/home-hero';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function HomePage({ searchParams }: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  // Keep bookmarked search URLs working after moving the library.
  if (params.q !== undefined) {
    const query = new URLSearchParams();
    if (params.q.trim()) query.set('q', params.q.trim());
    if (params.page) query.set('page', params.page);
    redirect('/explore' + (query.size ? '?' + query : ''));
  }

  return (
    <>

      <HomeHero />
      <main className="w-full pt-10 sm:pt-14 flex-1 space-y-14 sm:space-y-16 scroll-mt-32" id="home-content">
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="featured-works-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="home-section-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1F2937]">Dấu ấn nghiên cứu</p>
              <h2 id="featured-works-title" className="mt-2 text-2xl font-semibold tracking-tight text-[#1F2937] sm:text-3xl">Công trình nổi bật</h2>
            </div>
            <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-slate-50">
              Xem tất cả công trình <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5">
            <HomeFeaturedSection />

          </div>
        </section>

        <section className="research-band" aria-labelledby="research-directions-title">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeResearchSection />
          </div>
        </section>

        <HomeMomentsSection />

        <section className="members-band" aria-labelledby="home-members-title">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="home-section-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1F2937]">Con người của CLB</p>
              <h2 id="home-members-title" className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1F2937]">Thành viên</h2>
              <p className="mt-3 text-sm text-[#1F2937]">Cùng nghiên cứu, cùng xây dựng và chia sẻ tri thức.</p>
            </div>
            <Link href="/members" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-[#FFFFFF]">
              Xem tất cả thành viên <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <HomeMembersSection />
          </div>
        </section>
      </main>

    </>
  );
}
