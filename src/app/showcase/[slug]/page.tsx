import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { VideoPlayer } from '@/components/video-player';
import { StatusBadge, TypeBadge, RoleBadge } from '@/components/ui/badge';
import { CitationModal } from '@/components/citation-modal';
import { AdminReviewButton } from '@/components/admin-review-button';
import { PinToggleButton } from '@/components/pin-toggle-button';
import { VisibilityToggleButton } from '@/components/visibility-toggle-button';
import { publicUserSelect } from '@/lib/public-user';
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
  Download,
  Eye,
  Paperclip,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default async function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const currentUser = session?.user as any;

  const item = await prisma.showcaseItem.findUnique({
    where: { slug },
    include: {
      contributors: {
        include: { user: { select: publicUserSelect } },
        orderBy: { displayOrder: 'asc' },
      },
      links: true,
      attachments: true,
    },
  });

  const isAuthorizedToPreview =
    currentUser &&
    (currentUser.role === 'ADMIN' || currentUser.id === item?.creatorId);

  if (!item || (item.status !== 'PUBLISHED' && !isAuthorizedToPreview)) {
    notFound();
  }

  if (item.visibility === 'PRIVATE' && !currentUser) {
    redirect(`/login?callbackUrl=/showcase/${slug}`);
  }

  const videoLink = item.links.find((l) => l.type === 'VIDEO_EMBED');
  const paperLink = item.links.find((l) => l.type === 'PAPER_URL');
  const githubLink = item.links.find((l) => l.type === 'GITHUB');
  const liveDemoLink = item.links.find((l) => l.type === 'LIVE_DEMO');
  const otherLinks = item.links.filter(
    (l) => !['VIDEO_EMBED', 'PAPER_URL', 'GITHUB', 'LIVE_DEMO'].includes(l.type)
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl flex-1">
        {/* Preview Banner for Admin / Creator */}
        {item.status !== 'PUBLISHED' && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-sm sm:text-base font-serif">
                    Chế độ xem trước công trình nghiên cứu
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs sm:text-sm text-amber-800">
                  {item.status === 'PENDING_REVIEW'
                    ? 'Bài nộp đang chờ thẩm định học thuật và xét duyệt xuất bản.'
                    : item.status === 'DRAFT'
                    ? 'Bản nháp cá nhân. Chưa gửi yêu cầu xét duyệt xuất bản.'
                    : `Công trình cần chỉnh sửa bổ sung: ${item.rejectionReason || 'Vui lòng cập nhật lại theo yêu cầu.'}`}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
            {currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW' && (

                <AdminReviewButton itemId={item.id} />

            )}
            {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
              ((currentUser?.id === item.creatorId && (currentUser?.role === 'CORE_MEMBER' || currentUser?.role === 'ADMIN')) || currentUser?.role === 'ADMIN') ? (
                <Link
                  href={`/dashboard/items/${item.id}/edit`}
                  className="px-4 py-2 bg-[#0F294A] hover:bg-[#1E3A5F] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {item.status === 'REJECTED' ? 'Sửa & Gửi lại duyệt' : 'Chỉnh sửa bài viết'}
                </Link>
              ) : currentUser?.id === item.creatorId && currentUser?.role === 'MEMBER' ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                  Chỉ xem (Cần quyền Core Member để sửa)
                </span>
              ) : null
            )}
            </div>
          </div>
        )}

        {/* Breadcrumb Back Link */}
        <Link
          href={currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW' ? '/admin/reviews' : '/'}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0F294A] mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>
            {currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW'
              ? 'Quay lại danh sách duyệt bài'
              : 'Quay lại danh mục công trình'}
          </span>
        </Link>

        {/* Paper Header Card */}
        <header className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <TypeBadge type={item.type} />
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                item.visibility === 'PUBLIC'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {item.visibility === 'PUBLIC' ? '🌐 Công khai' : '🔒 Nội bộ'}
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Năm công bố: {item.publishedYear}</span>
            </div>
            {item.issuer && (
              <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{item.issuer}</span>
              </div>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight font-serif">
            {item.title}
          </h1>

          <div className="mt-6 p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tóm tắt đề tài (Abstract)
            </h2>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              {item.summary}
            </p>
          </div>

          {/* Standardized Uniform Action Cards Panel */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
            {/* Citation Generator */}
            <CitationModal
              item={item}
              className="h-11 px-4 sm:px-5 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-sm font-bold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
            />

            {/* Admin Visibility Toggle */}
            {currentUser?.role === 'ADMIN' && (
              <VisibilityToggleButton
                itemId={item.id}
                initialVisibility={item.visibility}
              />
            )}

            {/* Admin Pin Toggle */}
            {currentUser?.role === 'ADMIN' && item.status === 'PUBLISHED' && (
              <PinToggleButton
                itemId={item.id}
                initialIsPinned={item.isPinned}
                status={item.status}
              />
            )}

            {paperLink && (
              <a
                href={paperLink.url}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-200 shadow-2xs text-sm font-semibold transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Đọc bài báo gốc</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
              </a>
            )}

            {githubLink && (
              <a
                href={githubLink.url}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-200 shadow-2xs text-sm font-semibold transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <Github className="w-4 h-4 text-slate-900 shrink-0" />
                <span>Mã nguồn GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
              </a>
            )}

            {liveDemoLink && (
              <a
                href={liveDemoLink.url}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-200 shadow-2xs text-sm font-semibold transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trang web chạy thử</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
              </a>
            )}

            {otherLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-200 shadow-2xs text-sm font-semibold transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </header>

        {/* Video Demo Section */}
        {videoLink && (
          <section className="mb-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 font-serif">
              <span>Video Trình Diễn &amp; Demo</span>
            </h2>
            <VideoPlayer url={videoLink.url} title={item.title} />
          </section>
        )}

        {/* Full-Text PDF & Attachments Section */}
        {item.attachments && item.attachments.length > 0 && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 font-serif">
                <Paperclip className="w-5 h-5 text-slate-500" />
                <span>Tài Liệu Toàn Văn &amp; Phụ Lục Nghiên Cứu</span>
              </h2>
              <span className="text-sm text-slate-500 font-semibold">
                {item.attachments.length} tệp đính kèm
              </span>
            </div>

            <div className="space-y-3">
              {item.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-200/80">
                      PDF
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {att.fileName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {(att.fileSize / (1024 * 1024)).toFixed(2)} MB • {att.mimeType}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all shadow-2xs inline-flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span>Xem online</span>
                    </a>
                    <a
                      href={att.fileUrl}
                      download={att.fileName}
                      className="h-10 px-4 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs sm:text-sm font-bold transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4 text-blue-200" />
                      <span>Tải về PDF</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Authors Section */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 font-serif">
              <Users className="w-5 h-5 text-[#0F294A]" />
              <span>Tác giả &amp; Người hướng dẫn</span>
            </h2>
            <span className="text-sm text-slate-500 font-semibold">{item.contributors.length} thành viên</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.contributors.map((c) => {
              const name = c.user?.fullName || c.externalName || 'Thành viên ẩn danh';
              const isAdvisor = c.role === 'ADVISOR';

              return (
                <div
                  key={c.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isAdvisor
                      ? 'bg-purple-50/40 border-purple-200 hover:border-purple-300'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full font-bold flex items-center justify-center text-base shrink-0 shadow-2xs ${
                      isAdvisor
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#0F294A]/10 text-[#0F294A]'
                    }`}
                  >
                    {isAdvisor ? <GraduationCap className="w-5 h-5" /> : name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      {c.user ? (
                        <Link
                          href={`/members/${c.user.id}`}
                          className="font-bold text-slate-900 hover:text-[#0F294A] transition-colors truncate block text-sm sm:text-base"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900 truncate block text-sm sm:text-base">{name}</span>
                      )}
                    </div>

                    <div className="mt-1.5">
                      <RoleBadge role={c.role} customTitle={c.customRoleTitle} />
                    </div>

                    {c.externalAffiliation && (
                      <p className="text-xs text-slate-500 mt-1.5 truncate">{c.externalAffiliation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Markdown Content Section */}
        {item.content && (
          <section className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 font-serif">Nội dung chi tiết</h2>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {item.content}
            </div>
          </section>
        )}
      </main>

      {/* Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
