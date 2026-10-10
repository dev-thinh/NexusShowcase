import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { VideoPlayer } from '@/components/video-player';
import { TypeBadge, RoleBadge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Github,
  Globe,
  Calendar,
  Building2,
  Users,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';

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
  const otherLinks = item.links.filter(
    (l) => !['VIDEO_EMBED', 'PAPER_URL', 'GITHUB', 'LIVE_DEMO'].includes(l.type)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        {/* Breadcrumb Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh mục công trình</span>
        </Link>

        {/* Paper Header Card */}
        <header className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <TypeBadge type={item.type} />
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Năm công bố: {item.publishedYear}</span>
            </div>
            {item.issuer && (
              <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.issuer}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            {item.title}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {item.summary}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            {paperLink && (
              <a
                href={paperLink.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Đọc bài báo gốc</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
            {githubLink && (
              <a
                href={githubLink.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Github className="w-4 h-4" />
                <span>Mã nguồn GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
            {liveDemoLink && (
              <a
                href={liveDemoLink.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Globe className="w-4 h-4" />
                <span>Trang web chạy thử</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
            {otherLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <span>{link.label}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        </header>

        {/* Video Demo Section */}
        {videoLink && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Video Trình Diễn &amp; Demo</span>
            </h2>
            <VideoPlayer url={videoLink.url} title={item.title} />
          </section>
        )}

        {/* Authors Section */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Tác giả &amp; Người hướng dẫn</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{item.contributors.length} thành viên</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.contributors.map((c) => {
              const name = c.user?.fullName || c.externalName || 'Thành viên ẩn danh';
              const isAdvisor = c.role === 'ADVISOR';

              return (
                <div
                  key={c.id}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                    isAdvisor
                      ? 'bg-purple-50/40 border-purple-200 hover:border-purple-300'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full font-bold flex items-center justify-center text-sm shrink-0 shadow-xs ${
                      isAdvisor
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600/10 text-blue-600'
                    }`}
                  >
                    {isAdvisor ? <GraduationCap className="w-5 h-5" /> : name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      {c.user ? (
                        <Link
                          href={`/members/${c.user.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block text-sm"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900 truncate block text-sm">{name}</span>
                      )}
                    </div>

                    <div className="mt-1">
                      <RoleBadge role={c.role} customTitle={c.customRoleTitle} />
                    </div>

                    {c.externalAffiliation && (
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{c.externalAffiliation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Markdown Content Section */}
        {item.content && (
          <section className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Nội dung chi tiết</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {item.content}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
