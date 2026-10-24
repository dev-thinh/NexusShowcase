import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getSession } from '@/features/identity/server/session';
import { MemberCard } from '@/features/members/components/member-card';
import { MemberSectionHeading } from '@/features/members/components/member-section-heading';
import {
MEMBER_GROUP_LABELS
} from '@/features/members/model/directory';
import { listDirectory } from '@/features/members/server/queries';
import { LoadingCards } from '@/shared/ui/loading-content';
import { MemberPagination } from '@/shared/ui/member-pagination';
import { ArrowRight } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { Suspense } from 'react';

export default async function MembersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; adminPage?: string; corePage?: string }>;
}) {
  async function MemberResults() {
    const params = await searchParams;
    const session = await getSession();
    const authenticated = !!session?.user;
    const [advisoryPage, experiencedPage, regularPage] = await Promise.all([
      listDirectory({ authenticated, role: 'ADMIN', page: params.adminPage, pageSize: 12 }),
      listDirectory({ authenticated, role: 'CORE_MEMBER', page: params.corePage, pageSize: 12 }),
      listDirectory({ authenticated, role: 'MEMBER', page: params.page, pageSize: 6 }),
    ]);
    const advisors = advisoryPage.items, experienced = experiencedPage.items;
    const totalMembers = advisoryPage.total + experiencedPage.total + regularPage.total;
    const preserved = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) preserved.set(key, value);
    const basePath = '/members' + (preserved.size ? '?' + preserved : '');

    return <>
        <p className="mb-5 text-sm font-semibold text-[#1F2937]">{totalMembers} thành viên</p>
        {advisors.length > 0 && (
          <section className="mb-10" aria-labelledby="leadership-heading">
            <div id="leadership-heading">
              <MemberSectionHeading
                title={MEMBER_GROUP_LABELS.ADMIN}
                count={advisoryPage.total}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advisors.map((member) => (
                <MemberCard key={member.id} member={member} group="ADMIN" />
              ))}
            </div>
          <div className="mt-6"><MemberPagination page={advisoryPage.page} totalPages={advisoryPage.totalPages} basePath={basePath} pageParam="adminPage" /></div>
</section>
        )}

        {experienced.length > 0 && (
          <section className="mb-10" aria-labelledby="experienced-heading">
            <div id="experienced-heading">
              <MemberSectionHeading
                title={MEMBER_GROUP_LABELS.CORE_MEMBER}
                count={experiencedPage.total}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {experienced.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  group="CORE_MEMBER"
                />
              ))}
            </div>
          <div className="mt-6"><MemberPagination page={experiencedPage.page} totalPages={experiencedPage.totalPages} basePath={basePath} pageParam="corePage" /></div>
</section>
        )}

        <section className="mb-8" aria-labelledby="members-heading">
          <div id="members-heading">
            <MemberSectionHeading
              title={MEMBER_GROUP_LABELS.MEMBER}
              count={regularPage.total}
            />
          </div>

          {regularPage.total > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularPage.items.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    group="MEMBER"
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <MemberPagination
                  page={regularPage.page}
                  totalPages={regularPage.totalPages}
                  basePath={basePath}
                />
                <Link
                  href="/members/all"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-brand-button hover:brightness-110 text-white text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
                >
                  Xem tất cả thành viên
                  <ArrowRight aria-hidden="true" className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="panel-public p-6 text-sm text-[#1F2937]">
              Chưa có thành viên được công bố.
            </div>
          )}
        </section>
    </>;
  }

  return (
    <>


      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
      <Breadcrumbs items={[{ label: "Thành viên" }]} />
        <header className="mb-10 pb-7 border-b border-slate-200">
          <div className="min-w-0">
              <span className="page-eyebrow">Con người của CLB</span><h1 className="page-title">
                Thành viên CLB Robotics &amp; IoT
              </h1>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#1F2937]">
                Cùng nghiên cứu, cùng xây dựng và chia sẻ tri thức.
              </p>
          </div>
        </header>

        <Suspense fallback={<LoadingCards members />}><MemberResults /></Suspense>
      </main>


    </>
  );
}
