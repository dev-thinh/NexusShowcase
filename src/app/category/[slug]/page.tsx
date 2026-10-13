import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { CitationModal } from '@/components/citation-modal';
import { TypeBadge } from '@/components/ui/badge';
import { publicUserSelect } from '@/lib/public-user';
import {
  FileText,
  Github,
  Globe,
  Calendar,
  Building2,
  Award,
  Database,
  ArrowRight,
  ExternalLink,
  Download,
  FolderGit2,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const currentUser = session?.user;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const items = await prisma.showcaseItem.findMany({
    where: {
      categoryId: category.id,
      status: 'PUBLISHED',
      ...(currentUser ? {} : { visibility: 'PUBLIC' }),
    },
    include: {
      contributors: {
        include: { user: { select: publicUserSelect } },
        orderBy: { displayOrder: 'asc' },
      },
      links: true,
      attachments: true,
    },
    orderBy: [
      { isPinned: 'desc' },
      { publishedYear: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const getLayoutIcon = () => {
    switch (category.layoutType) {
      case 'BIBLIOGRAPHY':
        return <BookOpen className="w-6 h-6 text-blue-600" />;
      case 'DATA_CATALOG':
        return <Database className="w-6 h-6 text-emerald-600" />;
      case 'HONOR_ROLL':
        return <Award className="w-6 h-6 text-amber-600" />;
      case 'SHOWCASE_GRID':
      default:
        return <FolderGit2 className="w-6 h-6 text-[#0F294A]" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl flex-1">
        {/* Category Header */}
        <header className="mb-10 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
              {getLayoutIcon()}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Chuyên mục công trình
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {category.name}
              </h1>
            </div>
          </div>
          {category.description && (
            <p className="text-base text-slate-600 max-w-3xl leading-relaxed mt-2">
              {category.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>
              {items.length} công trình được công bố
            </span>
          </div>
        </header>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Chưa có công trình nào</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Chuyên mục này hiện chưa có bài viết xuất bản hoặc các bài viết đang được lưu hành nội bộ.
            </p>
          </div>
        ) : (
          <div>
            {/* 1. BIBLIOGRAPHY Layout */}
            {category.layoutType === 'BIBLIOGRAPHY' && (
              <div className="space-y-6">
                {items.map((item) => {
                  const paperLink = item.links.find((l) => l.type === 'PAPER_URL');
                  return (
                    <article
                      key={item.id}
                      className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <TypeBadge type={item.type} />
                        <span>•</span>
                        <span>Năm {item.publishedYear}</span>
                        {item.issuer && (
                          <>
                            <span>•</span>
                            <span className="text-slate-700">{item.issuer}</span>
                          </>
                        )}
                        {item.visibility === 'PRIVATE' && (
                          <span className="ml-auto text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                            🔒 Nội bộ
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        <Link
                          href={`/showcase/${item.slug}`}
                          className="hover:text-blue-800 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h2>

                      {/* Authors */}
                      <p className="text-sm text-slate-700 font-medium">
                        Tác giả:{' '}
                        {item.contributors.map((c, idx) => (
                          <span key={c.id}>
                            {c.user?.fullName || c.externalName}
                            {c.role === 'ADVISOR' ? ' (GVHD)' : ''}
                            {idx < item.contributors.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>

                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                        <CitationModal
                          item={item}
                          className="h-9 px-3 rounded-lg bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                        />
                        {paperLink && (
                          <a
                            href={paperLink.url}
                            target="_blank"
                            rel="noreferrer"
                            className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Bài báo gốc</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                        <Link
                          href={`/showcase/${item.slug}`}
                          className="ml-auto text-xs font-bold text-[#0F294A] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Xem chi tiết đề tài</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* 2. SHOWCASE_GRID Layout */}
            {category.layoutType === 'SHOWCASE_GRID' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                  const demoLink = item.links.find((l) => l.type === 'LIVE_DEMO');
                  const githubLink = item.links.find((l) => l.type === 'GITHUB');
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col"
                    >
                      {item.thumbnailUrl ? (
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                          <FolderGit2 className="w-12 h-12 stroke-[1.5]" />
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <TypeBadge type={item.type} />
                          {item.visibility === 'PRIVATE' && (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                              🔒 Nội bộ
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">
                          <Link
                            href={`/showcase/${item.slug}`}
                            className="hover:text-blue-800 transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h2>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4 flex-1">
                          {item.summary}
                        </p>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            {demoLink && (
                              <a
                                href={demoLink.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Xem Live Demo"
                                className="p-1.5 rounded-md hover:bg-slate-100 text-emerald-600"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                            {githubLink && (
                              <a
                                href={githubLink.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Mã nguồn GitHub"
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-800"
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <Link
                            href={`/showcase/${item.slug}`}
                            className="text-[#0F294A] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Xem chi tiết</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* 3. DATA_CATALOG Layout */}
            {category.layoutType === 'DATA_CATALOG' && (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={item.type} />
                        <span className="text-xs text-slate-500 font-medium">
                          Năm công bố: {item.publishedYear}
                        </span>
                        {item.visibility === 'PRIVATE' && (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            🔒 Nội bộ
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        <Link
                          href={`/showcase/${item.slug}`}
                          className="hover:text-blue-800 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h2>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                        {item.summary}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {item.attachments && item.attachments.length > 0 && (
                        <a
                          href={item.attachments[0].fileUrl}
                          download={item.attachments[0].fileName}
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Tải dữ liệu ({item.attachments.length} tệp)</span>
                        </a>
                      )}
                      <Link
                        href={`/showcase/${item.slug}`}
                        className="h-9 px-3 rounded-lg bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>Mô tả & Thông số</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. HONOR_ROLL Layout */}
            {category.layoutType === 'HONOR_ROLL' && (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                            {item.issuer || 'Giải thưởng Khoa học'}
                          </span>
                          <span className="text-xs font-bold text-amber-800">
                            Năm {item.publishedYear}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                          <Link
                            href={`/showcase/${item.slug}`}
                            className="hover:text-amber-900 transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h2>
                        <p className="text-xs text-slate-700 max-w-2xl">
                          {item.summary}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 pt-1">
                          Thành viên thực hiện:{' '}
                          {item.contributors
                            .map((c) => c.user?.fullName || c.externalName)
                            .join(', ')}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/showcase/${item.slug}`}
                      className="shrink-0 h-9 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors self-end md:self-center"
                    >
                      <span>Xem chi tiết giải thưởng</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <AcademicFooter />
    </div>
  );
}
