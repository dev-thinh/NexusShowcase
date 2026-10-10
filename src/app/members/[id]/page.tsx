import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ShowcaseCard } from '@/components/showcase-card';
import {
  FileText,
  Code2,
  Trophy,
  Github,
  Linkedin,
  GraduationCap,
  Globe,
  Inbox,
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
    include: {
      contributions: {
        where: {
          item: { status: 'PUBLISHED' },
        },
        include: {
          item: {
            include: {
              contributors: {
                include: { user: true },
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
    ADMIN: { label: 'Thầy Chủ Nhiệm CLB', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: ShieldCheck },
    CORE_MEMBER: { label: 'Core Member (Thành viên nòng cốt)', color: 'bg-blue-100 text-blue-900 border-blue-300', icon: UserCheck },
    MEMBER: { label: 'Thành viên CLB', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: UserCheck },
    GUEST: { label: 'Khách', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: UserCheck },
  };

  const currentRole = roleBadgeConfig[user.role] || roleBadgeConfig.MEMBER;
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        {/* Profile Header */}
        <header className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-md shrink-0">
            {user.fullName.charAt(0)}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {user.fullName}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentRole.color}`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{currentRole.label}</span>
              </span>
            </div>

            {user.studentId && (
              <p className="text-xs text-slate-400 font-semibold mb-2">MSSV: {user.studentId}</p>
            )}

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed mb-5">
              {user.bio || 'Chưa cập nhật tiểu sử cá nhân.'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-semibold">
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}
              {user.googleScholarUrl && (
                <a
                  href={user.googleScholarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Google Scholar</span>
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              )}
              {user.portfolioUrl && (
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Member Portfolios */}
        <div className="space-y-12">
          {/* Papers */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Bài báo khoa học đã tham gia</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold ml-1">
                {papers.length}
              </span>
            </div>
            {papers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
                Chưa có bài báo khoa học nào trong danh mục.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Dự án công nghệ đã xây dựng</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold ml-1">
                {projects.length}
              </span>
            </div>
            {projects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
                Chưa có dự án công nghệ nào trong danh mục.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          {/* Achievements */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Giải thưởng &amp; Đóng góp cho CLB</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold ml-1">
                {achievements.length}
              </span>
            </div>
            {achievements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
                Chưa có giải thưởng hoặc cống hiến nào trong danh mục.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((a) => (
                  <ShowcaseCard key={a.id} item={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
