
'use client';

import { useI18n } from '@/shared/i18n/provider';
import { ConferenceDetails } from '@/features/publications/components/conference-details';
import { MediaImage } from '@/shared/ui/media-image';
import { ArticleContent, ArticleTableOfContents } from '@/features/submissions/components/article-content';
import { ResourceLinks } from '@/features/submissions/components/resource-links';
import { articleFromLegacy, serializeArticle, standaloneResources } from '@/features/submissions/model/article';
import type { SubmissionSnapshot } from '@/features/submissions/model/snapshot';

export function SubmissionPreview({ snapshot }: { snapshot: SubmissionSnapshot }) {
  const { t: tr } = useI18n();

  const content = serializeArticle(articleFromLegacy(snapshot.content));
  return <article className="min-w-0 space-y-8 rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
    <header className="border-b border-slate-200 pb-6">
      <div className={snapshot.thumbnailUrl ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8' : ''}>
        <div className="min-w-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#1F2937]">{snapshot.type === 'RESEARCH_PAPER' ? tr("Nghiên cứu khoa học") : tr("Dự án")} · {snapshot.publishedYear}</p>
          <h1 className="break-words text-2xl font-semibold leading-snug text-[#1F2937] sm:text-3xl">{snapshot.title}</h1>
          <p className="mt-3 text-sm leading-7 text-[#1F2937]">{snapshot.contributors.map(c => c.displayName || c.externalName || tr('Thành viên')).join(', ')}</p>
        </div>
        {snapshot.thumbnailUrl && <MediaImage src={snapshot.thumbnailUrl} alt={tr("Hình minh họa: {0}", snapshot.title)} className="article-header-thumbnail" />}
      </div>
    </header>
    <ConferenceDetails value={snapshot.conference} />
    <ArticleTableOfContents content={content} />
    <section id="abstract" className="scroll-mt-36"><h2 className="mb-3 text-xl font-semibold text-[#1F2937]">{tr("Tóm tắt")}</h2><p className="whitespace-pre-line break-words text-justify text-base leading-8 text-[#1F2937]">{snapshot.summary}</p></section>
    <ArticleContent content={content} />
    <section><h2 className="mb-4 text-lg font-semibold text-[#1F2937]">{tr("Tài nguyên")}</h2><ResourceLinks resources={standaloneResources(snapshot.content, snapshot.resources)} /></section>
  </article>;
}
