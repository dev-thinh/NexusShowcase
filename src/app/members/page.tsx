import { Suspense } from 'react';
import { LoadingCards } from '@/components/loading-content';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AcademicFooter } from '@/components/academic-footer';
import { MemberCard } from '@/components/member-card';
import { MemberPagination } from '@/components/member-pagination';
import { MemberSectionHeading } from '@/components/member-section-heading';
import { Navbar } from '@/components/navbar';
import {
  MEMBER_GROUP_LABELS,
  paginateMembers,
  sortMembersByContribution,
  type MemberDirectoryEntry,
} from '@/lib/member-directory';
import { prisma } from '@/lib/prisma';
import { publicUserSelect } from '@/lib/public-user';

export default async function MembersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  async function MemberResults() {
    const params = await searchParams;
    const members = (await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: { in: ['ADMIN', 'CORE_MEMBER', 'MEMBER'] },
      },
      select: {
        ...publicUserSelect,
        studentId: true,
        _count: {
          select: {
            contributions: {
              where: { item: { status: 'PUBLISHED' } },
            },
          },
        },
      },
    })) as MemberDirectoryEntry[];

    const advisors = sortMembersByContribution(
      members.filter((member) => member.role === 'ADMIN'),
    );
    const experienced = sortMembersByContribution(
      members.filter((member) => member.role === 'CORE_MEMBER'),
    );
    const regularMembers = sortMembersByContribution(
      members.filter((member) => member.role === 'MEMBER'),
    );
    const regularPage = paginateMembers(regularMembers, params.page, 6);

    return <>
        <p className="mb-5 text-sm font-semibold text-slate-500">{members.length} thành viên</p>
        {advisors.length > 0 && (
          <section className="mb-10" aria-labelledby="leadership-heading">
            <div id="leadership-heading">
              <MemberSectionHeading
                title={MEMBER_GROUP_LABELS.ADMIN}
                count={advisors.length}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advisors.map((member) => (
                <MemberCard key={member.id} member={member} group="ADMIN" />
              ))}
            </div>
          </section>
        )}

        {experienced.length > 0 && (
          <section className="mb-10" aria-labelledby="experienced-heading">
            <div id="experienced-heading">
              <MemberSectionHeading
                title={MEMBER_GROUP_LABELS.CORE_MEMBER}
                count={experienced.length}
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
          </section>
        )}

        <section className="mb-8" aria-labelledby="members-heading">
          <div id="members-heading">
            <MemberSectionHeading
              title={MEMBER_GROUP_LABELS.MEMBER}
              count={regularMembers.length}
            />
          </div>

          {regularMembers.length > 0 ? (
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
                  basePath="/members"
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
            <div className="panel-public p-6 text-sm text-slate-600">
              Chưa có thành viên được công bố.
            </div>
          )}
        </section>
    </>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <header className="mb-10 pb-7 border-b border-slate-200">
          <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight tracking-tight">
                Thành viên CLB Robotics &amp; IoT
              </h1>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-slate-500">
                Cùng nghiên cứu, cùng xây dựng và chia sẻ tri thức.
              </p>
          </div>
        </header>

        <Suspense fallback={<LoadingCards members />}><MemberResults /></Suspense>
      </main>

      <AcademicFooter />
    </div>
  );
}
