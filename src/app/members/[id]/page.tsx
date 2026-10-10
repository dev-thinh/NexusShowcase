import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ShowcaseCard } from '@/components/showcase-card';

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

  const roleTitleMap: Record<string, string> = {
    ADMIN: 'Thầy Chủ Nhiệm CLB',
    CORE_MEMBER: 'Thành Viên Nòng Cốt (Core Member)',
    MEMBER: 'Thành Viên CLB (Member)',
    GUEST: 'Khách',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        {/* Profile Header */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{user.fullName}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {roleTitleMap[user.role] || user.role}
              </span>
            </div>

            {user.studentId && <p className="text-xs text-slate-400 font-medium mb-2">MSSV: {user.studentId}</p>}
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed mb-4">{user.bio || 'Chưa cập nhật tiểu sử.'}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  GitHub
                </a>
              )}
              {user.googleScholarUrl && (
                <a href={user.googleScholarUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Google Scholar
                </a>
              )}
              {user.linkedinUrl && (
                <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Member Showcase Portfolios */}
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>📄 Bài báo khoa học đã tham gia</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                {papers.length}
              </span>
            </h2>
            {papers.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có bài báo khoa học nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>💻 Dự án công nghệ đã xây dựng</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                {projects.length}
              </span>
            </h2>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có dự án nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🏆 Giải thưởng & Đóng góp cho CLB</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                {achievements.length}
              </span>
            </h2>
            {achievements.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có giải thưởng hoặc cống hiến nào.</p>
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
