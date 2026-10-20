import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AcademicFooter } from '@/components/academic-footer';
import { MemberCard } from '@/components/member-card';
import { MemberPagination } from '@/components/member-pagination';
import { Navbar } from '@/components/navbar';
import {
  paginateMembers,
  sortMembersByContribution,
  type MemberDirectoryEntry,
} from '@/lib/member-directory';
import { prisma } from '@/lib/prisma';
import { publicUserSelect } from '@/lib/public-user';

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
  const members = sortMembersByContribution(
    (await prisma.user.findMany({
      where: { status: 'ACTIVE', role: 'MEMBER' },
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
    })) as MemberDirectoryEntry[],
  );
  const memberPage = paginateMembers(members, params.page, 12);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <header className="mb-8 pb-6 border-b border-slate-200">
          <Link
            href="/members"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F294A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] rounded"
          >
            <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            Quay lại trang thành viên
          </Link>

          <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight tracking-tight">
                Tất cả thành viên
              </h1>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-slate-500">
                {members.length} thành viên
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
          <div className="panel-public p-6 text-sm text-slate-600">
            Chưa có thành viên được công bố.
          </div>
        )}
      </main>

      <AcademicFooter />
    </div>
  );
}
