import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getSession } from '@/features/identity/server/session';
import { HomeMemberWall } from '@/features/members/components/home-member-wall';
import { MemberSectionHeading } from '@/features/members/components/member-section-heading';
import { listDirectory } from '@/features/members/server/queries';
import { Suspense } from 'react';

export default async function MembersDirectoryPage() {
  async function MemberResults() {
    const session = await getSession();
    const authenticated = !!session?.user;
    const [advisoryPage, experiencedPage, regularPage] = await Promise.all([
      listDirectory({ authenticated, role: 'ADMIN', page: 1, pageSize: 'all' }),
      listDirectory({ authenticated, role: 'CORE_MEMBER', page: 1, pageSize: 'all' }),
      listDirectory({ authenticated, role: 'MEMBER', page: 1, pageSize: 'all' }),
    ]);
    const advisors = advisoryPage.items, experienced = experiencedPage.items;
    const totalMembers = advisoryPage.total + experiencedPage.total + regularPage.total;

    return <>
        <p className="mb-5 text-sm font-semibold text-[#1F2937]">{totalMembers} thành viên</p>
          <section className="mb-10" aria-labelledby="leadership-heading">
            <div id="leadership-heading">
              <MemberSectionHeading
                title="Ban chủ nhiệm"
                count={advisoryPage.total}
              />
            </div>
            {advisors.length > 0 ? (
              <HomeMemberWall members={advisors.map(({ id, publicSlug, fullName, avatarUrl, role }) => ({ id, publicSlug, fullName, avatarUrl, role }))} total={advisors.length} showMeta={false} />
            ) : (
              <p className="text-sm text-slate-600">Chưa có thành viên nào</p>
            )}
</section>

          <section className="mb-10" aria-labelledby="experienced-heading">
            <div id="experienced-heading">
              <MemberSectionHeading
                title="Trưởng nhóm"
                count={experiencedPage.total}
              />
            </div>
            {experienced.length > 0 ? (
              <HomeMemberWall members={experienced.map(({ id, publicSlug, fullName, avatarUrl, role }) => ({ id, publicSlug, fullName, avatarUrl, role }))} total={experienced.length} showMeta={false} />
            ) : (
              <p className="text-sm text-slate-600">Chưa có thành viên nào</p>
            )}
</section>

        <section className="mb-8" aria-labelledby="members-heading">
          <div id="members-heading">
            <MemberSectionHeading
              title="Thành viên"
              count={regularPage.total}
            />
          </div>

          {regularPage.total > 0 ? (
            <>
              <HomeMemberWall members={regularPage.items.map(({ id, publicSlug, fullName, avatarUrl, role }) => ({ id, publicSlug, fullName, avatarUrl, role }))} total={regularPage.items.length} showMeta={false} />
            </>
          ) : (
            <p className="text-sm text-slate-600">Chưa có thành viên nào</p>
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
                Thành viên CLB Robotics &amp; IoT - HCMUS
              </h1>
          </div>
        </header>

        <Suspense fallback={<div className="home-member-grid" role="status" aria-label="Đang tải thành viên">{Array.from({ length: 12 }, (_, index) => <span key={index} className="home-member-avatar home-member-avatar--loading" aria-hidden="true" />)}</div>}><MemberResults /></Suspense>
      </main>


    </>
  );
}
