import { ResourceLinks } from '@/components/resource-links';
import { standaloneResources } from '@/lib/article-content';
import { ArticleContent, ArticleTableOfContents } from '@/components/article-content';
import { articleFromLegacy, serializeArticle } from '@/lib/article-content';
import type { SubmissionSnapshot } from '@/lib/submission-types';

export function SubmissionPreview({ snapshot }: { snapshot: SubmissionSnapshot }) {
  const content = serializeArticle(articleFromLegacy(snapshot.content));
  return <article className="min-w-0 space-y-8 rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
    <header className="border-b border-slate-200 pb-6"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{snapshot.type === 'RESEARCH_PAPER' ? 'Nghiên cứu khoa học' : 'Dự án'} · {snapshot.publishedYear}</p><h1 className="break-words text-2xl font-semibold leading-snug text-[#0F294A] sm:text-3xl">{snapshot.title}</h1><p className="mt-3 text-sm leading-7 text-slate-600">{snapshot.contributors.map(c => c.displayName || c.externalName || 'Thành viên').join(', ')}</p></header>
    <ArticleTableOfContents content={content} />
    <section id="abstract" className="scroll-mt-36"><h2 className="mb-3 text-xl font-semibold text-[#0F294A]">Abstract / Tóm tắt</h2><p className="whitespace-pre-line break-words text-base leading-8 text-slate-700">{snapshot.summary}</p></section>
    <ArticleContent content={content} />
    <section><h2 className="mb-4 text-lg font-semibold text-[#0F294A]">Tài nguyên</h2><ResourceLinks resources={standaloneResources(snapshot.content, snapshot.resources)} /></section>
  </article>;
}
