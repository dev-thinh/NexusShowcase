import { HomeContentProvider, HomeText, HomeContentLink as Link } from '@/features/publications/components/home-content-provider';
import { HomeFeaturedSection, HomeMembersSection, HomeMomentsSection, HomeResearchSection } from './home-sections';
import { HomeHero } from '@/features/publications/components/home-hero';
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
    redirect('/research' + (query.size ? '?' + query : ''));
  }

  return (
    <HomeContentProvider>
      <HomeHero />
      <main className="w-full pt-10 sm:pt-14 flex-1 space-y-14 sm:space-y-16" id="home-content">
        <section className="home-featured" aria-labelledby="featured-works-title">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="home-section-heading">
                <p className="home-section-eyebrow"><HomeText field="featuredEyebrow">Dấu ấn nghiên cứu</HomeText></p>
                <h2 id="featured-works-title" className="home-section-title"><HomeText field="featuredTitle">Công trình nổi bật</HomeText></h2>
              </div>
              <Link href="/research" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-slate-50">
                <HomeText field="featuredAction">Xem nghiên cứu khoa học</HomeText> <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 grid gap-5">
              <HomeFeaturedSection />
            </div>
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
                <p className="home-section-eyebrow"><HomeText field="membersEyebrow">Đội ngũ CLB</HomeText></p>
                <h2 id="home-members-title" className="home-section-title"><HomeText field="membersTitle">Thành viên</HomeText></h2>
              </div>
              <Link href="/members" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-[#FFFFFF]">
                <HomeText field="membersAction">Xem tất cả thành viên</HomeText> <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <HomeMembersSection />
          </div>
        </section>
      </main>
    </HomeContentProvider>
  );
}
