'use client';

import { ContributorNames } from '@/features/publications/components/contributor-names';


import { CardResourceLink } from '@/features/publications/components/card-resource-link';

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
import { ArrowRight } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

  export async function loadHomeFeatured(signal: AbortSignal) {
    const { items: featuredItems, isAdmin } = await fetchDeferredJson<{ items: PublicationCardDto[]; isAdmin: boolean }>('/api/home?section=featured', signal);
    const returnTo = '/';
    return <div className="grid gap-5">{featuredItems.length === 0 ? (
              <EmptyState title="Chưa có công trình nổi bật" description="Các công trình đã công bố sẽ xuất hiện tại đây." />
            ) : featuredItems.map(item => {


              return (
                <article key={item.id} className="clickable-card home-featured-card publication-card panel-public grid min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white !p-0 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                  <CardLink slug={item.slug} returnTo={returnTo} />
                  <Link href={showcaseHref(item.slug, returnTo)} aria-label={`Xem công trình: ${item.title}`} className="publication-card__media relative flex aspect-[2/1] min-w-0 items-center justify-center overflow-hidden border-b border-slate-200 bg-[#FFFFFF] md:aspect-auto md:min-h-56 md:border-b-0 md:border-r">
                    <div className="absolute inset-0 flex items-center justify-center md:inset-4"><MediaImage optimized={item.thumbnailUrl?.startsWith('/')} src={item.thumbnailUrl} alt={`Hình minh họa: ${item.title}`} width={640} height={480} sizes="(max-width: 767px) 90vw, 320px" loading="eager" decoding="async" className="home-featured-thumbnail" /></div>
                  </Link>
                  <div className="relative flex min-w-0 flex-col px-3 pt-3 sm:px-6 sm:pt-5">
                    <header>
                      <div className="home-featured-meta publication-card__meta flex items-center justify-between gap-1 md:gap-3">
                        <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#1F2937] md:flex-wrap md:gap-2">
                          <TypeBadge type={item.type} size="sm" variant="outline" />
                          {item.publishedYear && <span aria-label={`Năm ${item.publishedYear}`} className="whitespace-nowrap"><span className="hidden md:inline">Năm </span>{item.publishedYear}</span>}
                        </div>
                        {isAdmin && <div className="home-featured-admin shrink-0"><CardAdminControls itemId={item.id} itemTitle={item.title} initialIsPinned={item.isPinned} initialVisibility={item.visibility} /></div>}
                      </div>
                      <h3 className="mt-2 shrink-0 line-clamp-2 text-base font-semibold leading-6 tracking-tight text-[#1F2937] md:h-7 md:line-clamp-1 md:text-xl md:leading-7" title={item.title}>
                        <Link href={showcaseHref(item.slug, returnTo)} className="hover:text-[#1F2937] focus-visible:underline">{item.title}</Link>
                      </h3>
                      {item.contributors.length > 0 && (
                        <p className="mt-1 truncate text-sm leading-relaxed text-foreground-muted" title={item.contributors.map(c => c.user?.fullName || c.externalName).filter(Boolean).join(', ')}>

                          <ContributorNames contributors={item.contributors} />
                        </p>
                      )}
                    </header>
                    <p className="mb-2 mt-2 line-clamp-2 h-12 shrink-0 break-words text-sm leading-6 text-[#1F2937]">{item.summary}</p>
                    <footer className="publication-card__footer mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 py-2">
                      <CitationModal triggerVariant="icon" item={toCitationDto(item)} className="inline-flex min-h-9 shrink-0 items-center gap-2 text-sm font-semibold text-[#1F2937] hover:text-[#1F2937] hover:underline" />
                      <CardResourceLink links={item.links} detailHref={showcaseHref(item.slug, returnTo)} />
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
