
import { getServerI18n } from '@/shared/i18n/server';
import { MobileArticleContents } from '@/features/submissions/components/mobile-article-contents';
import { cache } from 'react';
import type { Metadata } from 'next';
import { PublicSectionMarker } from '@/shared/navigation/public-section-context';
import { categoryPagePath } from '@/shared/lib/page-urls';
import { ConferenceDetails } from '@/features/publications/components/conference-details';
import { ContributorNames, ContributorName } from '@/features/publications/components/contributor-names';
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
import { parseArticleContent, publicationResources, standaloneResources } from '@/features/submissions/model/article';
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

const getAuthorizedDetail = cache(async (slug: string) => {
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
    redirect(`/login?callbackUrl=/works/${slug}`);
  }

  return { item, currentUser };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { item } = await getAuthorizedDetail((await params).slug);
  return { title: item.title };
}

export default async function ShowcaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { t: tr } = await getServerI18n();

  const { slug } = await params;
  const { item, currentUser } = await getAuthorizedDetail(slug);

  const structured = parseArticleContent(item.content);
  const videoLink = item.links.find((l) => l.type === 'VIDEO_EMBED');
  const sidebarResources = standaloneResources(item.content ?? '', buildSubmissionSnapshot(item).resources);

  const mobileResources = publicationResources(item.content ?? '', buildSubmissionSnapshot(item).resources)
    .filter(resource => resource.kind === 'DOCUMENT' || (resource.kind === 'LINK' && resource.linkType !== 'VIDEO_EMBED'));

  const categorySlug = item.type === 'PROJECT' ? 'robotics-iot' : 'bai-bao-khoa-hoc';
  const categoryName = item.type === 'PROJECT' ? 'Dự án & Sản phẩm' : 'Nghiên cứu khoa học';
  const source = await searchParams;
  const backHref = showcaseReturnTarget(source?.returnTo, categoryPagePath(categorySlug));
  const breadcrumbParents = currentUser?.role === 'ADMIN' && item.status === 'PENDING_REVIEW'
    ? [{ label: 'Quản trị', href: '/admin' }, { label: 'Phê duyệt bài đăng', href: '/admin/reviews' }]
    : backHref === '/' ? [] : [{
      label: backHref.startsWith('/?') ? 'Khám phá công trình'
        : backHref.startsWith('/projects') ? 'Dự án & Sản phẩm'
        : backHref.startsWith('/research') ? 'Nghiên cứu khoa học' : categoryName,
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
      <PublicSectionMarker pathname={`/works/${slug}`} section={item.type === 'PROJECT' ? '/projects' : '/research'} />

      <main className="flex-1">
        <header className="border-b border-slate-200 bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-white">
          <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <Breadcrumbs items={[...breadcrumbParents, { label: item.title, translate: false }]} />
        {/* Preview Banner for Admin / Creator */}
        {item.status !== 'PUBLISHED' && (
          <div className="panel-callout mb-6 bg-[#FFFFFF] border-slate-200 text-[#1F2937] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#1F2937] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm sm:text-base">{tr("Chế độ xem trước công trình nghiên cứu")}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs sm:text-sm text-[#1F2937]">
                  {item.status === 'PENDING_REVIEW'
                    ? tr("Bài nộp đang chờ Admin phê duyệt.")
                    : item.status === 'DRAFT'
                    ? tr("Bản nháp cá nhân. Chưa gửi yêu cầu xét duyệt xuất bản.")
                    : tr("Công trình cần chỉnh sửa bổ sung: {0}", item.rejectionReason || 'Vui lòng cập nhật lại theo yêu cầu.')}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
            {currentUser?.role === 'ADMIN' && ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.status) && (
              <Link
                href={`/admin/reviews/${item.id}`}
                className="px-4 py-2 bg-brand-button hover:brightness-110 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
              >{tr("Mở trang phê duyệt")}</Link>
            )}
            {(item.status === 'DRAFT' || item.status === 'REVISION_REQUESTED') && (
              ((currentUser?.id === item.creatorId && (currentUser?.role === 'CORE_MEMBER' || currentUser?.role === 'ADMIN')) || currentUser?.role === 'ADMIN') ? (
                <Link
                  href={`/my-works/${item.id}/edit`}
                  className="px-4 py-2 bg-brand-button hover:brightness-110 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                >
                  {item.status === 'REVISION_REQUESTED' ? tr("Sửa & Gửi lại duyệt") : tr("Chỉnh sửa bài viết")}
                </Link>
              ) : currentUser?.id === item.creatorId && currentUser?.role === 'MEMBER' ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#FFFFFF] text-[#1F2937] border border-slate-200">{tr("Chỉ xem (Cần quyền Trưởng nhóm để sửa)")}</span>
              ) : null
            )}
            </div>
          </div>
        )}


            <div className={item.thumbnailUrl ? 'grid items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8' : ''}>
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#1F2937]">
                  <TypeBadge type={item.type} variant="outline" />
                  {item.publishedYear && <span>{item.publishedYear}</span>}
                  {item.isPinned && <span className="font-semibold text-[#1F2937]">{tr("Công trình tiêu biểu")}</span>}
                </div>
                <h1 className="page-title max-w-5xl break-words">{item.title}</h1>
                {item.contributors.length > 0 && (
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-[#1F2937] sm:text-base">
                    <ContributorNames contributors={item.contributors} />
                  </p>
                )}
              </div>
              {item.thumbnailUrl && (
                <MediaImage
                  src={item.thumbnailUrl}
                  alt={tr("Hình minh họa: {0}", item.title)}
                  className="article-header-thumbnail"
                />
              )}
            </div>

          </div>
        </header>

        <div className="container mx-auto grid max-w-7xl items-start gap-10 px-4 py-9 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:px-8">
          {structured?.sections.length ? <MobileArticleContents><ArticleTableOfContents content={item.content ?? ''} /></MobileArticleContents> : null}
          <article className="min-w-0 space-y-8 sm:space-y-10">
            <ConferenceDetails value={item.conference} />
            <section id="abstract" aria-labelledby="abstract-title" className="scroll-mt-24">
              <h2 id="abstract-title" className="mb-3 text-base font-semibold text-[#1F2937]">{tr("Tóm tắt")}</h2>
              <p className="whitespace-pre-line break-words text-justify text-base leading-8 text-[#1F2937]">{item.summary}</p>
            </section>

            <div className="space-y-4 lg:hidden">
              {mobileResources.length > 0 && <section aria-label={tr("Tài nguyên công trình")} className="space-y-2">
                <ResourceLinks resources={mobileResources} />
              </section>}
            </div>

            {item.content && <ArticleContent content={item.content} />}

            {!structured && figures.length > 0 && (
              <section id="figures" aria-labelledby="figures-title" className="scroll-mt-24">
                <h2 id="figures-title" className="mb-4 text-base font-semibold text-[#1F2937]">{tr("Hình ảnh & Thực nghiệm")}</h2>
                <div className="space-y-6">
                  {figures.map((figure, index) => (
                    <figure key={figure.id} className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <MediaImage src={figure.fileUrl} alt={figure.fileName} loading="lazy" className="mx-auto block h-auto max-h-[36rem] max-w-full rounded-md object-contain" />
                      <figcaption className="text-center text-sm text-[#1F2937]">{tr("Hình ")}{index + 1}. {figure.fileName}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {!structured && videoLink && (
              <section id="demo" aria-labelledby="demo-title" className="scroll-mt-24">
                <h2 id="demo-title" className="mb-4 text-base font-semibold text-[#1F2937]">{tr("Video trình diễn")}</h2>
                <VideoPlayer url={videoLink.url} title={item.title} />
              </section>
            )}

            {!structured && documents.length > 0 && (
              <section id="documents" aria-labelledby="documents-title" className="scroll-mt-24">
                <h2 id="documents-title" className="mb-3 text-base font-semibold text-[#1F2937]">{tr("Toàn văn & Tài liệu đính kèm")}</h2>
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
                        <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#1F2937] hover:underline"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{tr("Xem")}</a>
                        <a href={document.fileUrl} download={document.fileName} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#1F2937] hover:underline"><Download className="h-3.5 w-3.5" aria-hidden="true" />{tr("Tải về")}</a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="min-w-0 space-y-7 border-t border-slate-200 pt-6 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0" aria-label={tr("Tài nguyên và nhóm thực hiện")}>
            <div className="hidden lg:block"><ArticleTableOfContents content={item.content ?? ''} /></div>
            <section id="resources" className="scroll-mt-28" aria-labelledby="resources-title">
              <h2 id="resources-title" className="mb-4 text-base font-semibold text-[#1F2937]">{tr("Tài nguyên")}</h2>
              <div className="flex flex-col items-stretch gap-2">
                <CitationModal item={toCitationDto(item)} className="action-secondary-detail" />
                <ResourceLinks resources={sidebarResources} />
              </div>
            </section>


            {item.contributors.length > 0 && (
              <section className="border-t border-slate-200 pt-6" aria-labelledby="authors-title">
                <h2 id="authors-title" className="mb-4 text-base font-semibold text-[#1F2937]">{tr("Nhóm thực hiện")}</h2>
                <ul className="space-y-4">
                  {item.contributors.map(contributor => {
                    const name = contributor.user?.fullName || contributor.externalName || 'Thành viên';
                    return (
                      <li key={contributor.id} className="flex items-start gap-3">
                        <MemberAvatar fullName={name} className="h-9 w-9 shrink-0 rounded-full text-xs" />
                        <div className="min-w-0">
                          <span className="text-sm text-[#1F2937]"><ContributorName contributor={contributor} /></span>
                          <p className="mt-1 text-xs leading-5 text-[#1F2937]">{contributor.customRoleTitle || tr(contributorRoles[contributor.role])}</p>
                          {contributor.externalAffiliation && <p className="mt-1 text-xs leading-5 text-[#1F2937]">{contributor.externalAffiliation}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}




            {currentUser?.role === 'ADMIN' && (
              <section className="border-t border-slate-200 pt-6" aria-label={tr("Quản lý công trình")}>
                <h2 className="mb-3 text-base font-semibold text-[#1F2937]">{tr("Quản lý")}</h2>
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
