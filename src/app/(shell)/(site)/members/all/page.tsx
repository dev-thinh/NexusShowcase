import { getSession } from '@/features/identity/server/session';
import { MemberCard } from '@/features/members/components/member-card';
import { listDirectory } from '@/features/members/server/queries';
import { MemberPagination } from '@/shared/ui/member-pagination';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';


export const metadata = {
  title: 'Tất cả thành viên - CLB Robotics & IoT',
  description: 'Danh sách thành viên CLB Robotics & IoT.',
};

export default async function AllMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const memberPage = await listDirectory({ authenticated: !!session?.user, role: 'MEMBER', page: params.page, pageSize: 12 });
  const members = memberPage.items;

  return (
    <>


      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <header className="mb-8 pb-6 border-b border-slate-200">
          <Breadcrumbs items={[{ label: "Thành viên", href: "/members" }, { label: "Tất cả thành viên" }]} />

          <div className="min-w-0">
              <span className="page-eyebrow">Danh bạ thành viên</span><h1 className="page-title">
                Tất cả thành viên
              </h1>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#1F2937]">
                {memberPage.total} thành viên
              </p>
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

            <div className="mt-7">
              <MemberPagination
                page={memberPage.page}
                totalPages={memberPage.totalPages}
                basePath="/members/all"
              />
            </div>
          </>
        ) : (
          <div className="panel-public p-6 text-sm text-[#1F2937]">
            Chưa có thành viên được công bố.
          </div>
        )}
      </main>


    </>
  );
}
