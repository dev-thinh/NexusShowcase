import { MediaImage } from '@/shared/ui/media-image';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { getSession as auth } from '@/features/identity/server/session';
import { StatusBadge, TypeBadge } from '@/features/publications/components/badges';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import { CitationModal } from '@/features/publications/components/citation-modal';
import { toCitationDto } from '@/features/publications/model/contracts';
import { showcaseReturnTarget } from '@/features/publications/model/navigation';
import { publicationDetailSelect } from '@/features/publications/server/selects';
import { ArticleContent, ArticleTableOfContents } from '@/features/submissions/components/article-content';
import { ResourceLinks } from '@/features/submissions/components/resource-links';
import { parseArticleContent, standaloneResources } from '@/features/submissions/model/article';
import { buildSubmissionSnapshot } from '@/features/submissions/model/snapshot-mapper';
import { prisma } from '@/server/db/prisma';
import { VideoPlayer } from '@/shared/ui/video-player';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import {
Clock,
Download,
Eye,
FileText,
} from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { notFound, redirect } from 'next/navigation';

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
  const currentUser = session?.user;

  const item = await prisma.showcaseItem.findUnique({
    select: publicationDetailSelect,
    where: { slug },
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
  const breadcrumbParents = currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW'
    ? [{ label: 'Quản trị', href: '/admin' }, { label: 'Phê duyệt bài đăng', href: '/admin/reviews' }]
    : backHref === '/' ? [] : [{
      label: backHref.startsWith('/explore') || backHref.startsWith('/?') ? 'Khám phá công trình'
        : backHref.startsWith('/category/robotics-iot') ? 'Robotics & IoT'
        : backHref.startsWith('/category/bai-bao-khoa-hoc') ? 'Nghiên cứu khoa học' : categoryName,
      href: backHref,
    }];
  const documents = item.attachments.filter(attachment => !attachment.mimeType.startsWith('image/'));
  const figures = item.attachments.filter(attachment => attachment.mimeType.startsWith('image/') && attachment.fileUrl !== item.thumbnailUrl);
  const contributorRoles: Record<string, string> = {
    ADVISOR: 'Người hướng dẫn', FIRST_AUTHOR: 'Tác giả chính', CO_FIRST_AUTHOR: 'Đồng tác giả chính',
    CO_AUTHOR: 'Đồng tác giả', CORRESPONDING_AUTHOR: 'Tác giả liên hệ', PROJECT_LEAD: 'Trưởng nhóm',
    CONTRIBUTOR: 'Thành viên đóng góp', CUSTOM: 'Thành viên',
  };

  return (
    <>

      <main className="flex-1">
        <header className="border-b border-slate-200 bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-white">
          <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <Breadcrumbs items={[...breadcrumbParents, { label: item.title }]} />
        {/* Preview Banner for Admin / Creator */}
        {item.status !== 'PUBLISHED' && (
          <div className="panel-callout mb-6 bg-[#FFFFFF] border-slate-200 text-[#1F2937] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#1F2937] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm sm:text-base">
                    Chế độ xem trước công trình nghiên cứu
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs sm:text-sm text-[#1F2937]">
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
                <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#FFFFFF] text-[#1F2937] border border-slate-200">
                  Chỉ xem (Cần quyền Core Member để sửa)
                </span>
              ) : null
            )}
            </div>
          </div>
        )}


            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#1F2937]">
              <TypeBadge type={item.type} variant="outline" />
              {item.publishedYear && <span>{item.publishedYear}</span>}
              {item.isPinned && <span className="font-semibold text-[#1F2937]">Công trình tiêu biểu</span>}
            </div>
            <h1 className="page-title max-w-5xl break-words">{item.title}</h1>
            {item.contributors.length > 0 && (
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[#1F2937] sm:text-base">
                {item.contributors.map((contributor, index) => (
                  <span key={contributor.id}>
                    {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="hover:text-[#1F2937]">{contributor.user.fullName}</Link> : contributor.externalName || 'Thành viên'}
                    {contributor.role === 'ADVISOR' && <sup className="ml-0.5 text-xs" title="Người hướng dẫn">†</sup>}
                    {index < item.contributors.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            )}
            {item.issuer && <p className="mt-3 text-sm italic leading-relaxed text-[#1F2937]">{item.issuer}</p>}

          </div>
        </header>

        <div className="container mx-auto grid max-w-7xl items-start gap-10 px-4 py-9 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:px-8">
          <article className="min-w-0 space-y-8 sm:space-y-10">
            <section id="abstract" aria-labelledby="abstract-title" className="scroll-mt-24">
              <h2 id="abstract-title" className="mb-3 text-base font-semibold text-[#1F2937]">Tóm tắt</h2>
              <p className="whitespace-pre-line break-words text-base leading-8 text-[#1F2937]">{item.summary}</p>
            </section>

            {(
              <figure className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <MediaImage src={item.thumbnailUrl} alt={`Hình minh họa: ${item.title}`} className="mx-auto flex min-h-48 w-full max-h-[32rem] max-w-full rounded-md object-contain" />
                <figcaption className="text-center text-xs leading-6 text-[#1F2937]">Hình tổng quan công trình</figcaption>
              </figure>
            )}

            {item.content && <ArticleContent content={item.content} />}

            {!structured && figures.length > 0 && (
              <section id="figures" aria-labelledby="figures-title" className="scroll-mt-24">
                <h2 id="figures-title" className="mb-4 text-base font-semibold text-[#1F2937]">Hình ảnh &amp; Thực nghiệm</h2>
                <div className="space-y-6">
                  {figures.map((figure, index) => (
                    <figure key={figure.id} className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <MediaImage src={figure.fileUrl} alt={figure.fileName} loading="lazy" className="mx-auto block h-auto max-h-[36rem] max-w-full rounded-md object-contain" />
                      <figcaption className="text-center text-sm text-[#1F2937]">Hình {index + 1}. {figure.fileName}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {!structured && videoLink && (
              <section id="demo" aria-labelledby="demo-title" className="scroll-mt-24">
                <h2 id="demo-title" className="mb-4 text-base font-semibold text-[#1F2937]">Video trình diễn</h2>
                <VideoPlayer url={videoLink.url} title={item.title} />
              </section>
            )}

            {!structured && documents.length > 0 && (
              <section id="documents" aria-labelledby="documents-title" className="scroll-mt-24">
                <h2 id="documents-title" className="mb-3 text-base font-semibold text-[#1F2937]">Toàn văn &amp; Tài liệu đính kèm</h2>
                <div className="divide-y divide-[#153D67] border-y border-slate-200">
                  {documents.map(document => (
                    <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-[#1F2937]" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-[#1F2937]">{document.fileName}</p>
                          <p className="mt-1 text-xs text-[#1F2937]">{(document.fileSize / (1024 * 1024)).toFixed(2)} MB · {document.mimeType}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#1F2937] hover:underline"><Eye className="h-3.5 w-3.5" aria-hidden="true" />Xem</a>
                        <a href={document.fileUrl} download={document.fileName} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#1F2937] hover:underline"><Download className="h-3.5 w-3.5" aria-hidden="true" />Tải về</a>
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
              <h2 id="resources-title" className="mb-4 text-base font-semibold text-[#1F2937]">Tài nguyên</h2>
              <div className="flex flex-col items-stretch gap-2">
                <ResourceLinks resources={sidebarResources} />
                <CitationModal item={toCitationDto(item)} className="action-secondary-detail" />
              </div>
            </section>


            {item.contributors.length > 0 && (
              <section className="border-t border-slate-200 pt-6" aria-labelledby="authors-title">
                <h2 id="authors-title" className="mb-4 text-base font-semibold text-[#1F2937]">Nhóm thực hiện</h2>
                <ul className="space-y-4">
                  {item.contributors.map(contributor => {
                    const name = contributor.user?.fullName || contributor.externalName || 'Thành viên';
                    return (
                      <li key={contributor.id} className="flex items-start gap-3">
                        <MemberAvatar fullName={name} className="h-9 w-9 shrink-0 rounded-full text-xs" />
                        <div className="min-w-0">
                          {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="text-sm font-semibold text-[#1F2937] hover:text-[#1F2937]">{name}</Link> : <span className="text-sm font-semibold text-[#1F2937]">{name}</span>}
                          <p className="mt-1 text-xs leading-5 text-[#1F2937]">{contributor.customRoleTitle || contributorRoles[contributor.role]}</p>
                          {contributor.externalAffiliation && <p className="mt-1 text-xs leading-5 text-[#1F2937]">{contributor.externalAffiliation}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}




            {currentUser?.role === 'ADMIN' && (
              <section className="border-t border-slate-200 pt-6" aria-label="Quản lý công trình">
                <h2 className="mb-3 text-base font-semibold text-[#1F2937]">Quản lý</h2>
                <div className="flex flex-wrap gap-2">
                  <CardAdminControls variant="detail" itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} showPin={item.status === 'PUBLISHED'} />
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

    </>
  );
}
