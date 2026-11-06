import { localizedMetadata } from '@/shared/i18n/metadata';

import { getServerI18n } from '@/shared/i18n/server';
import { getSession } from '@/features/identity/server/session';
import { MemberCard } from '@/features/members/components/member-card';
import { listDirectory } from '@/features/members/server/queries';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';


export const generateMetadata = localizedMetadata({
  title: 'Tất cả thành viên',
  description: 'Danh sách thành viên CLB Robotics & IoT - HCMUS.',
});

export default async function AllMembersPage() {
  const { t: tr } = await getServerI18n();

  const session = await getSession();
  const memberPage = await listDirectory({ authenticated: !!session?.user, role: 'MEMBER', page: 1, pageSize: 'all' });
  const members = memberPage.items;

  return (
    <>


      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <header className="mb-8 pb-6 border-b border-slate-200">
          <Breadcrumbs items={[{ label: "Thành viên", href: "/members" }, { label: "Tất cả thành viên" }]} />

          <div className="min-w-0">
              <span className="page-eyebrow">{tr("Danh bạ thành viên")}</span><h1 className="page-title">{tr("Tất cả thành viên")}</h1>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#1F2937]">
                {memberPage.total}{tr(" thành viên")}</p>
          </div>
        </header>

        {members.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberPage.items.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  group="MEMBER"
                />
              ))}
            </div>
          </>
        ) : (
          <div className="panel-public p-6 text-sm text-[#1F2937]">{tr("Chưa có thành viên được công bố.")}</div>
        )}
      </main>


    </>
  );
}
