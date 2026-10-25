'use client';

import { MediaImage } from '@/shared/ui/media-image';

import { fetchDeferredJson } from '@/shared/lib/deferred-fetch';
import { ResearchSectionHeading } from './research-section-heading';
import { DeferredSection } from '@/shared/ui/deferred-section';
import { LoadingCards } from '@/shared/ui/loading-content';
import type { PublicationCardDto } from '@/features/publications/model/contracts';
import type { HomeMembersPayload } from '@/features/members/model/home';
import type { MomentsPayload } from '@/features/publications/model/moments';

import { TypeBadge } from '@/features/publications/components/badges';
import { CardAdminControls } from '@/features/publications/components/card-admin-controls';
import { CardLink } from '@/features/publications/components/card-link';
import { CitationModal } from '@/features/publications/components/citation-modal';
import { toCitationDto } from '@/features/publications/model/contracts';
import { showcaseHref } from '@/features/publications/model/navigation';

import { EmptyState } from '@/shared/ui/empty-state';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

  export async function loadHomeFeatured(signal: AbortSignal) {
    const { items: featuredItems, isAdmin } = await fetchDeferredJson<{ items: PublicationCardDto[]; isAdmin: boolean }>('/api/home?section=featured', signal);
    const returnTo = '/';
    return <div className="grid gap-5">{featuredItems.length === 0 ? (
              <EmptyState title="Chưa có công trình nổi bật" description="Các công trình đã công bố sẽ xuất hiện tại đây." />
            ) : featuredItems.map(item => {
              const paperLink = item.links.find(link => link.type === 'PAPER_URL');
              const sourceLink = paperLink ?? item.links.find(link => link.type === 'GITHUB');
              return (
                <article key={item.id} className="clickable-card home-featured-card panel-public grid min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white !p-0 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                  <CardLink slug={item.slug} returnTo={returnTo} />
                  <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="relative flex aspect-[4/3] min-w-0 items-center justify-center overflow-hidden border-b border-slate-200 bg-[#FFFFFF] md:aspect-auto md:min-h-56 md:border-b-0 md:border-r">
                    <MediaImage optimized={item.thumbnailUrl?.startsWith('/')} src={item.thumbnailUrl} alt={`Hình minh họa: ${item.title}`} width={640} height={480} sizes="(max-width: 767px) 90vw, 320px" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-contain p-4" />
                  </Link>
                  <div className="flex min-w-0 flex-col px-5 pt-4 sm:px-6 sm:pt-5">
                    <header>
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#1F2937]">
                        <TypeBadge type={item.type} size="sm" variant="outline" />
                        {item.publishedYear && <span>Năm {item.publishedYear}</span>}
                      </div>
                        {isAdmin && <CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} />}
                      </div>
                      <h3 className="mt-2 h-7 shrink-0 line-clamp-1 text-lg font-semibold leading-7 tracking-tight text-[#1F2937] sm:text-xl" title={item.title}>
                        <Link href={showcaseHref(item.slug, returnTo)} className="hover:text-[#1F2937] focus-visible:underline">{item.title}</Link>
                      </h3>
                      {item.contributors.length > 0 && (
                        <p className="mt-1 truncate text-sm leading-relaxed text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>

                          {item.contributors.map((contributor, index) => (
                            <span key={contributor.id}>
                              {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="hover:text-[#1F2937]">{contributor.user.fullName}</Link> : contributor.externalName}

                              {index < item.contributors.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                      {item.issuer && <p className="mt-1 text-sm italic leading-relaxed text-[#1F2937]">{item.issuer}</p>}
                    </header>
                    <p className="mb-2 mt-2 line-clamp-2 h-12 shrink-0 break-words text-sm leading-6 text-[#1F2937]">{item.summary}</p>
                    <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 py-2">
                      {sourceLink && (
                        <a href={sourceLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline">
                          {paperLink ? 'Bài báo gốc' : 'Mã nguồn'} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                      <CitationModal item={toCitationDto(item)} className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline" />
                      <Link href={showcaseHref(item.slug, returnTo)} className="ml-auto inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#1F2937] hover:underline">
                        Xem công trình <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </footer>
                  </div>
                </article>
              );
            })}</div>;
  }

  async function loadHomeMembers(signal: AbortSignal) {
    const [data, { HomeMemberWall }] = await Promise.all([
      fetchDeferredJson<HomeMembersPayload>('/api/home?section=members', signal),
      import('@/features/members/components/home-member-wall'),
    ]);
    return <HomeMemberWall {...data} />;
  }

async function loadHomeResearch(signal: AbortSignal) {
  const [{ ResearchFlashcards }, gallery] = await Promise.all([
    import('./research-flashcards'),
    fetchDeferredJson<MomentsPayload>('/api/home/research', signal),
  ]);
  return <ResearchFlashcards initialGallery={gallery} />;
}

async function loadHomeMoments(signal: AbortSignal) {
  const [{ HomeMoments }, gallery] = await Promise.all([
    import('./home-moments'),
    fetchDeferredJson<MomentsPayload>('/api/home/moments', signal),
  ]);
  return <HomeMoments initialGallery={gallery} />;
}

export function HomeResearchSection() {
  return <DeferredSection name="research" load={loadHomeResearch} fallback={<><ResearchSectionHeading /><div className="home-research-placeholder" role="status" aria-label="Đang tải hướng nghiên cứu"><span /><span /><span /></div></>} />;
}

export function HomeMomentsSection() {
  return <DeferredSection name="moments" load={loadHomeMoments} fallback={<div className="home-moments-placeholder" role="status" aria-label="Đang tải hình ảnh hoạt động"><div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><span className="block h-3 w-40 rounded bg-slate-100" /><span className="mt-5 block h-20 max-w-xl rounded bg-slate-100" /></div><div className="home-moments-placeholder__photos" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(index => <span key={index} />)}</div></div>} />;
}

export function HomeFeaturedSection() {
  return <DeferredSection name="featured" load={loadHomeFeatured} fallback={<LoadingCards />} />;
}
export function HomeMembersSection() {
  return <DeferredSection name="members" load={loadHomeMembers} fallback={<div className="home-member-grid" role="status" aria-label="Đang tải thành viên">{Array.from({ length: 10 }, (_, index) => <span key={index} className="home-member-avatar home-member-avatar--loading" aria-hidden="true" />)}</div>} />;
}
