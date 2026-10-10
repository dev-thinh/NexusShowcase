import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { VideoPlayer } from '@/components/video-player';
import Link from 'next/link';

export default async function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.showcaseItem.findUnique({
    where: { slug },
    include: {
      contributors: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
      links: true,
      attachments: true,
    },
  });

  if (!item || item.status !== 'PUBLISHED') {
    notFound();
  }

  const videoLink = item.links.find((l) => l.type === 'VIDEO_EMBED');
  const paperLink = item.links.find((l) => l.type === 'PAPER_URL');
  const githubLink = item.links.find((l) => l.type === 'GITHUB');
  const liveDemoLink = item.links.find((l) => l.type === 'LIVE_DEMO');

  const roleNameMap: Record<string, string> = {
    ADVISOR: 'Người hướng dẫn',
    FIRST_AUTHOR: 'Tác giả chính',
    CO_FIRST_AUTHOR: 'Đồng tác giả 1',
    CO_AUTHOR: 'Đồng tác giả',
    CORRESPONDING_AUTHOR: 'Tác giả liên hệ',
    PROJECT_LEAD: 'Trưởng nhóm dự án',
    CONTRIBUTOR: 'Thành viên tham gia',
    CUSTOM: 'Đóng góp',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6">
          ← Quay lại danh mục
        </Link>

        <header className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {item.type}
            </span>
            <span className="text-sm font-medium text-slate-500">Năm công bố: {item.publishedYear}</span>
            {item.issuer && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                {item.issuer}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {item.title}
          </h1>

          <p className="mt-4 text-base text-slate-600 leading-relaxed font-normal">
            {item.summary}
          </p>

          {/* Quick Action Links */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            {paperLink && (
              <a
                href={paperLink.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                📄 Đọc bài báo gốc
              </a>
            )}
            {githubLink && (
              <a
                href={githubLink.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                💻 Mã nguồn GitHub
              </a>
            )}
            {liveDemoLink && (
              <a
                href={liveDemoLink.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                🌐 Mở Demo trực tiếp
              </a>
            )}
          </div>
        </header>

        {/* Video Demo Embed */}
        {videoLink && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Video Demo</h2>
            <VideoPlayer url={videoLink.url} title={item.title} />
          </div>
        )}

        {/* Danh sách Tác giả & Vai trò */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Danh sách Tác giả & Thành viên tham gia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.contributors.map((c) => {
              const name = c.user?.fullName || c.externalName || 'Thành viên ẩn danh';
              const roleDisplay = roleNameMap[c.role] || c.customRoleTitle || c.role;

              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-sm">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 truncate">
                    {c.user ? (
                      <Link
                        href={`/members/${c.user.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="font-bold text-slate-900 block truncate">{name}</span>
                    )}
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">{roleDisplay}</span>
                      {c.externalAffiliation && <span> • {c.externalAffiliation}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nội dung chi tiết */}
        {item.content && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm prose max-w-none">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nội dung chi tiết</h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-line">{item.content}</div>
          </div>
        )}
      </main>
    </div>
  );
}
