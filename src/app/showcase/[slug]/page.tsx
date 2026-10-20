import { ResourceLinks } from '@/components/resource-links';
import { standaloneResources } from '@/lib/article-content';
import { buildSubmissionSnapshot } from '@/lib/submission-snapshot';
import { ArticleContent, ArticleTableOfContents } from '@/components/article-content';
import { parseArticleContent } from '@/lib/article-content';
import { showcaseReturnTarget } from '@/lib/showcase-navigation';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession as auth } from '@/lib/session';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { VideoPlayer } from '@/components/video-player';
import { StatusBadge, TypeBadge } from '@/components/ui/badge';
import { CitationModal } from '@/components/citation-modal';
import { CardAdminControls } from '@/components/card-admin-controls';
import { publicUserSelect } from '@/lib/public-user';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ShowcaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const currentUser = session?.user as any;

  const item = await prisma.showcaseItem.findUnique({
    omit: { authorDraft: true },
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

  const structured = parseArticleContent(item.content);
  const videoLink = item.links.find((l) => l.type === 'VIDEO_EMBED');
  const sidebarResources = standaloneResources(item.content ?? '', buildSubmissionSnapshot(item).resources);

  const categorySlug = item.type === 'PROJECT' ? 'robotics-iot' : 'bai-bao-khoa-hoc';
  const categoryName = item.type === 'PROJECT' ? 'Robotics & IoT' : 'Nghiên cứu khoa học';
  const source = await searchParams;
  const backHref = showcaseReturnTarget(source?.returnTo, `/category/${categorySlug}`);
  const backLabel = backHref.startsWith('/?') || backHref === '/' ? 'Quay lại trang chủ'
    : backHref.startsWith('/category/robotics-iot') ? 'Robotics & IoT'
    : backHref.startsWith('/category/bai-bao-khoa-hoc') ? 'Nghiên cứu khoa học' : categoryName;
  const documents = item.attachments.filter(attachment => !attachment.mimeType.startsWith('image/'));
  const figures = item.attachments.filter(attachment => attachment.mimeType.startsWith('image/') && attachment.fileUrl !== item.thumbnailUrl);
  const contributorRoles: Record<string, string> = {
    ADVISOR: 'Người hướng dẫn', FIRST_AUTHOR: 'Tác giả chính', CO_FIRST_AUTHOR: 'Đồng tác giả chính',
    CO_AUTHOR: 'Đồng tác giả', CORRESPONDING_AUTHOR: 'Tác giả liên hệ', PROJECT_LEAD: 'Trưởng nhóm',
    CONTRIBUTOR: 'Thành viên đóng góp', CUSTOM: 'Thành viên',
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <header className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-slate-50 to-white">
          <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Preview Banner for Admin / Creator */}
        {item.status !== 'PUBLISHED' && (
          <div className="panel-callout mb-6 bg-amber-50 border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm sm:text-base">
                    Chế độ xem trước công trình nghiên cứu
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs sm:text-sm text-amber-800">
                  {item.status === 'PENDING_REVIEW'
                    ? 'Bài nộp đang chờ Admin phê duyệt.'
                    : item.status === 'DRAFT'
                    ? 'Bản nháp cá nhân. Chưa gửi yêu cầu xét duyệt xuất bản.'
                    : `Công trình cần chỉnh sửa bổ sung: ${item.rejectionReason || 'Vui lòng cập nhật lại theo yêu cầu.'}`}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
            {currentUser?.role === 'ADMIN' && ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.status) && (
              <Link
                href={`/admin/reviews/${item.id}`}
                className="px-4 py-2 bg-brand-button hover:brightness-110 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
              >
                Mở trang phê duyệt
              </Link>
            )}
            {(item.status === 'DRAFT' || item.status === 'REVISION_REQUESTED') && (
              ((currentUser?.id === item.creatorId && (currentUser?.role === 'CORE_MEMBER' || currentUser?.role === 'ADMIN')) || currentUser?.role === 'ADMIN') ? (
                <Link
                  href={`/dashboard/items/${item.id}/edit`}
                  className="px-4 py-2 bg-brand-button hover:brightness-110 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                >
                  {item.status === 'REVISION_REQUESTED' ? 'Sửa & Gửi lại duyệt' : 'Chỉnh sửa bài viết'}
                </Link>
              ) : currentUser?.id === item.creatorId && currentUser?.role === 'MEMBER' ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                  Chỉ xem (Cần quyền Core Member để sửa)
                </span>
              ) : null
            )}
            </div>
          </div>
        )}


            <Link href={currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW' ? '/admin/reviews' : backHref} className="mb-6 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#0F294A]">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW' ? 'Quay lại danh sách duyệt bài' : backLabel}
            </Link>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
              <TypeBadge type={item.type} variant="outline" />
              {item.publishedYear && <span>{item.publishedYear}</span>}
              {item.isPinned && <span className="font-semibold text-[#0F294A]">Công trình tiêu biểu</span>}
            </div>
            <h1 className="max-w-5xl break-words text-2xl font-semibold leading-snug tracking-tight text-[#0F294A] sm:text-3xl lg:text-4xl">{item.title}</h1>
            {item.contributors.length > 0 && (
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
                {item.contributors.map((contributor, index) => (
                  <span key={contributor.id}>
                    {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="hover:text-[#0F294A]">{contributor.user.fullName}</Link> : contributor.externalName || 'Thành viên'}
                    {contributor.role === 'ADVISOR' && <sup className="ml-0.5 text-xs" title="Người hướng dẫn">†</sup>}
                    {index < item.contributors.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            )}
            {item.issuer && <p className="mt-3 text-sm italic leading-relaxed text-slate-500">{item.issuer}</p>}

          </div>
        </header>

        <div className="container mx-auto grid max-w-7xl items-start gap-10 px-4 py-9 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:px-8">
          <article className="min-w-0 space-y-8 sm:space-y-10">
            <section id="abstract" aria-labelledby="abstract-title" className="scroll-mt-24">
              <h2 id="abstract-title" className="mb-3 text-base font-semibold text-[#0F294A]">Tóm tắt</h2>
              <p className="whitespace-pre-line break-words text-base leading-8 text-slate-700">{item.summary}</p>
            </section>

            {item.thumbnailUrl && (
              <figure className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnailUrl} alt={`Hình minh họa: ${item.title}`} className="mx-auto block h-auto max-h-[32rem] max-w-full rounded-md object-contain" />
                <figcaption className="text-center text-xs leading-6 text-slate-500">Hình tổng quan công trình</figcaption>
              </figure>
            )}

            {item.content && <ArticleContent content={item.content} />}

            {!structured && figures.length > 0 && (
              <section id="figures" aria-labelledby="figures-title" className="scroll-mt-24">
                <h2 id="figures-title" className="mb-4 text-base font-semibold text-[#0F294A]">Hình ảnh &amp; Thực nghiệm</h2>
                <div className="space-y-6">
                  {figures.map((figure, index) => (
                    <figure key={figure.id} className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={figure.fileUrl} alt={figure.fileName} loading="lazy" className="mx-auto block h-auto max-h-[36rem] max-w-full rounded-md object-contain" />
                      <figcaption className="text-center text-sm text-slate-500">Hình {index + 1}. {figure.fileName}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {!structured && videoLink && (
              <section id="demo" aria-labelledby="demo-title" className="scroll-mt-24">
                <h2 id="demo-title" className="mb-4 text-base font-semibold text-[#0F294A]">Video trình diễn</h2>
                <VideoPlayer url={videoLink.url} title={item.title} />
              </section>
            )}

            {!structured && documents.length > 0 && (
              <section id="documents" aria-labelledby="documents-title" className="scroll-mt-24">
                <h2 id="documents-title" className="mb-3 text-base font-semibold text-[#0F294A]">Toàn văn &amp; Tài liệu đính kèm</h2>
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {documents.map(document => (
                    <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-800">{document.fileName}</p>
                          <p className="mt-1 text-xs text-slate-500">{(document.fileSize / (1024 * 1024)).toFixed(2)} MB · {document.mimeType}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#0F294A] hover:underline"><Eye className="h-3.5 w-3.5" aria-hidden="true" />Xem</a>
                        <a href={document.fileUrl} download={document.fileName} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#0F294A] hover:underline"><Download className="h-3.5 w-3.5" aria-hidden="true" />Tải về</a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="min-w-0 space-y-7 border-t border-slate-200 pt-6 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0" aria-label="Tài nguyên và nhóm thực hiện">
            <ArticleTableOfContents content={item.content ?? ''} />
            <section aria-labelledby="resources-title">
              <h2 id="resources-title" className="mb-4 text-base font-semibold text-[#0F294A]">Tài nguyên</h2>
              <div className="flex flex-col items-stretch gap-2">
                <ResourceLinks resources={sidebarResources} />
                <CitationModal item={item} className="action-secondary-detail" />
              </div>
            </section>


            {item.contributors.length > 0 && (
              <section className="border-t border-slate-200 pt-6" aria-labelledby="authors-title">
                <h2 id="authors-title" className="mb-4 text-base font-semibold text-[#0F294A]">Nhóm thực hiện</h2>
                <ul className="space-y-4">
                  {item.contributors.map(contributor => {
                    const name = contributor.user?.fullName || contributor.externalName || 'Thành viên';
                    return (
                      <li key={contributor.id} className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/70 text-xs font-semibold text-[#0F294A]" aria-hidden="true">{name.charAt(0)}</span>
                        <div className="min-w-0">
                          {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="text-sm font-semibold text-slate-800 hover:text-[#0F294A]">{name}</Link> : <span className="text-sm font-semibold text-slate-800">{name}</span>}
                          <p className="mt-1 text-xs leading-5 text-slate-500">{contributor.customRoleTitle || contributorRoles[contributor.role]}</p>
                          {contributor.externalAffiliation && <p className="mt-1 text-xs leading-5 text-slate-500">{contributor.externalAffiliation}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}




            {currentUser?.role === 'ADMIN' && (
              <section className="border-t border-slate-200 pt-6" aria-label="Quản lý công trình">
                <h2 className="mb-3 text-base font-semibold text-[#0F294A]">Quản lý</h2>
                <div className="flex flex-wrap gap-2">
                  <CardAdminControls variant="detail" itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} showPin={item.status === 'PUBLISHED'} />
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
      <AcademicFooter />
    </div>
  );
}
