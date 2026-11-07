import { localizedMetadata } from '@/shared/i18n/metadata';

import { getServerI18n } from '@/shared/i18n/server';
export const generateMetadata = localizedMetadata({ title: 'Thành viên' });

import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getSession } from '@/features/identity/server/session';
import { MemberDirectoryList } from '@/features/members/components/member-directory-list';
import { MEMBER_DIRECTORY_PAGE_SIZE } from '@/features/members/model/directory-page';
import { MemberSectionHeading } from '@/features/members/components/member-section-heading';
import { HomeMemberWall } from '@/features/members/components/home-member-wall';
import { listDirectory, listLeadershipDirectory } from '@/features/members/server/queries';
import { Suspense } from 'react';
import { MemberDirectorySkeleton } from '@/shared/ui/content-skeletons';

export default async function MembersDirectoryPage() {
  const { t: tr } = await getServerI18n();

  async function MemberResults() {
    const session = await getSession();
    const authenticated = !!session?.user;
    const [advisors, experienced, regularPage] = await Promise.all([
      listLeadershipDirectory({ authenticated, role: 'ADMIN' }),
      listLeadershipDirectory({ authenticated, role: 'CORE_MEMBER' }),
      listDirectory({ authenticated, role: 'MEMBER', page: 1, pageSize: MEMBER_DIRECTORY_PAGE_SIZE }),
    ]);
    const totalMembers = advisors.length + experienced.length + regularPage.total;

    return <>
        <p className="mb-5 text-sm font-semibold text-[#1F2937]">{totalMembers}{tr(" thành viên")}</p>
          <section className="mb-10" aria-labelledby="leadership-heading">
            <div id="leadership-heading">
              <MemberSectionHeading
                title={tr("Ban chủ nhiệm")}
                count={advisors.length}
              />
            </div>
            {advisors.length > 0 ? (
              <HomeMemberWall members={advisors} total={advisors.length} showMeta={false} limitOnMobile={false} />
            ) : (
              <p className="text-sm text-slate-600">{tr("Chưa có thành viên nào")}</p>
            )}
</section>

          <section className="mb-10" aria-labelledby="experienced-heading">
            <div id="experienced-heading">
              <MemberSectionHeading
                title={tr("Trưởng nhóm")}
                count={experienced.length}
              />
            </div>
            {experienced.length > 0 ? (
              <HomeMemberWall members={experienced} total={experienced.length} showMeta={false} limitOnMobile={false} />
            ) : (
              <p className="text-sm text-slate-600">{tr("Chưa có thành viên nào")}</p>
            )}
</section>

        <section className="mb-8" aria-labelledby="members-heading">
          <div id="members-heading">
            <MemberSectionHeading
              title={tr("Thành viên")}
              count={regularPage.total}
            />
          </div>

          {regularPage.total > 0 ? (
            <>
              <MemberDirectoryList initialPage={regularPage} role="MEMBER" />
            </>
          ) : (
            <p className="text-sm text-slate-600">{tr("Chưa có thành viên nào")}</p>
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
              <span className="page-eyebrow">{tr("Con người của CLB")}</span><h1 className="page-title">{tr("Thành viên CLB Robotics & IoT - HCMUS")}</h1>
          </div>
        </header>

        <Suspense fallback={<MemberDirectorySkeleton />}><MemberResults /></Suspense>
      </main>


    </>
  );
}
