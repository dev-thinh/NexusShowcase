import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ShowcaseCard } from '@/components/showcase-card';
import { EmptyState } from '@/components/ui/empty-state';
import { publicUserSelect } from '@/lib/public-user';
import {
  FileText,
  Code2,
  Trophy,
  Github,
  Linkedin,
  GraduationCap,
  Globe,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...publicUserSelect,
      contributions: {
        where: {
          item: { status: 'PUBLISHED' },
        },
        include: {
          item: {
            include: {
              contributors: {
                include: { user: { select: publicUserSelect } },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { item: { publishedYear: 'desc' } },
      },
    },
  });

  if (!user) notFound();

  const publishedItems = user.contributions.map((c) => c.item);
  const papers = publishedItems.filter((i) => i.type === 'RESEARCH_PAPER');
  const projects = publishedItems.filter((i) => i.type === 'PROJECT');
  const achievements = publishedItems.filter((i) => i.type === 'ACHIEVEMENT');

  const roleBadgeConfig = {
    ADMIN: { label: 'Quản Trị Viên', color: 'bg-amber-50 text-amber-800 border-amber-200/80', icon: ShieldCheck },
    CORE_MEMBER: { label: 'CORE MEMBER', color: 'bg-blue-50 text-blue-800 border-blue-200/80', icon: UserCheck },
    MEMBER: { label: 'Thành viên', color: 'bg-slate-100 text-slate-700 border-slate-200/80', icon: UserCheck },
    GUEST: { label: 'Khách', color: 'bg-slate-100 text-slate-600 border-slate-200/80', icon: UserCheck },
  };

  const currentRole = roleBadgeConfig[user.role] || roleBadgeConfig.MEMBER;
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        {/* Profile Header */}
        <header className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs mb-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0F294A] text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-xs shrink-0 border-4 border-slate-100">
            {user.fullName.charAt(0)}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {user.fullName}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${currentRole.color}`}
              >
                <RoleIcon className="w-4 h-4" />
                <span>{currentRole.label}</span>
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-700 max-w-3xl leading-relaxed mb-6 font-normal">
              {user.bio || 'Chưa cập nhật tiểu sử nghiên cứu khoa học.'}
            </p>

            {/* Academic Metrics Row */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{papers.length}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Bài Báo</div>
              </div>
              <div className="border-x border-slate-200">
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{projects.length}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Dự Án</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-700">{achievements.length}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Giải Thưởng</div>
              </div>
            </div>

            {/* Social & Scholar Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-semibold">
              {user.googleScholarUrl && (
                <a
                  href={user.googleScholarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <span>Google Scholar</span>
                </a>
              )}
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors"
                >
                  <Github className="w-4 h-4 text-slate-800" />
                  <span>GitHub</span>
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn</span>
                </a>
              )}
              {user.portfolioUrl && (
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors"
                >
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Trang cá nhân</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Member Portfolios */}
        <div className="space-y-12">
          {/* Papers */}
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <FileText className="w-5 h-5 text-[#0F294A]" />
              <h2 className="text-xl font-bold text-slate-900">Bài báo khoa học</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold ml-1 border border-blue-200">
                {papers.length}
              </span>
            </div>
            {papers.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Chưa có bài báo khoa học nào"
                description="Thành viên này hiện chưa công bố bài báo khoa học nào trong danh mục hệ thống."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {papers.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <Code2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-xl font-bold text-slate-900">Dự án công nghệ</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1 border border-emerald-200">
                {projects.length}
              </span>
            </div>
            {projects.length === 0 ? (
              <EmptyState
                icon={Code2}
                title="Chưa có dự án công nghệ nào"
                description="Thành viên này hiện chưa đăng tải dự án công nghệ nào trong danh mục hệ thống."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {projects.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          {/* Achievements */}
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <Trophy className="w-5 h-5 text-amber-700" />
              <h2 className="text-xl font-bold text-slate-900">Giải thưởng &amp; Đóng góp</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold ml-1 border border-amber-200">
                {achievements.length}
              </span>
            </div>
            {achievements.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="Chưa có giải thưởng hoặc cống hiến nào"
                description="Thành viên này hiện chưa ghi nhận giải thưởng hoặc cống hiến nào trong danh mục hệ thống."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {achievements.map((a) => (
                  <ShowcaseCard key={a.id} item={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
