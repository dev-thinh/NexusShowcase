import React from 'react';
import { ExternalLink, FileText, Github } from 'lucide-react';
import { parseArticleContent, isGithubUrl } from '@/lib/article-content';
import type { ArticleBlock } from '@/lib/article-content';
import { VideoPlayer } from '@/components/video-player';

function inline(text: string): React.ReactNode[] {
  // Render a restricted Markdown subset with React text nodes; no raw HTML.
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm">{part.slice(1, -1)}</code>;
    return part;
  });
}
export function FormattedText({ text }: { text: string }) {
  return <div className="space-y-4 break-words text-base leading-8 text-slate-700 [overflow-wrap:anywhere]">{text.split(/\n\s*\n/).filter(p => p.trim()).map((part, index) => {
    const lines = part.split('\n');
    if (lines.every(line => /^[-*] /.test(line))) return <ul key={index} className="list-disc space-y-1 pl-6">{lines.map((line, i) => <li key={i}>{inline(line.slice(2))}</li>)}</ul>;
    if (lines.every(line => /^\d+\. /.test(line))) return <ol key={index} className="list-decimal space-y-1 pl-6">{lines.map((line, i) => <li key={i}>{inline(line.replace(/^\d+\. /, ''))}</li>)}</ol>;
    if (/^###? /.test(part) && lines.length === 1) return <h3 key={index} className="pt-2 text-lg font-semibold text-[#0F294A]">{inline(part.replace(/^###? /, ''))}</h3>;
    return <p key={index} className="whitespace-pre-line">{inline(part)}</p>;
  })}</div>;
}
export function ArticleBlockView({ block }: { block: ArticleBlock }) {
  if (block.kind === 'TEXT') return <FormattedText text={block.text} />;
  if (!block.url) return null;
  if (block.kind === 'IMAGE') return <figure className="min-w-0 space-y-2">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={block.url} alt={block.alt || block.caption} loading="lazy" className="mx-auto block h-auto max-h-[40rem] max-w-full rounded-md object-contain" />
    {block.caption && <figcaption className="text-center text-sm leading-6 text-slate-500">{block.caption}</figcaption>}
  </figure>;
  if (block.kind === 'VIDEO') return <figure className="space-y-3"><VideoPlayer url={block.url} title={block.caption || 'Video minh họa'} />{block.caption && <figcaption className="text-center text-sm text-slate-500">{block.caption}</figcaption>}</figure>;
  const github = isGithubUrl(block.url);
  const Icon = block.kind === 'DOCUMENT' ? FileText : github ? Github : ExternalLink;
  return <a href={block.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]">
    <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#0F294A]" />
    <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-slate-900">{block.caption || block.fileName || (github ? 'Xem mã nguồn GitHub' : 'Mở liên kết')}</span><span className="mt-1 block truncate text-xs text-slate-500">{block.kind === 'DOCUMENT' ? 'PDF · Xem / tải tài liệu' : block.url}</span></span>
    <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
  </a>;
}
export function ArticleContent({ content }: { content: string }) {
  const doc = parseArticleContent(content);
  if (!doc) return content ? <section id="overview" className="scroll-mt-28 space-y-4"><h2 className="text-xl font-semibold text-[#0F294A]">Nội dung công trình</h2><FormattedText text={content} /></section> : null;
  return <>{doc.sections.map((section, index) => <section key={section.id} id={`section-${index + 1}`} aria-labelledby={`section-title-${index + 1}`} className="scroll-mt-36 space-y-5">
    <h2 id={`section-title-${index + 1}`} className="break-words text-xl font-semibold tracking-tight text-[#0F294A]">{section.title}</h2>
    <div className="space-y-6">{section.blocks.map(block => <ArticleBlockView key={block.id} block={block} />)}</div>
  </section>)}</>;
}
export function ArticleTableOfContents({ content }: { content: string }) {
  const sections = parseArticleContent(content)?.sections ?? [];
  if (!sections.length) return null;
  return <nav aria-label="Mục lục bài viết" className="space-y-3"><h2 className="text-base font-semibold text-[#0F294A]">Mục lục</h2><ol className="space-y-2 text-sm leading-6 text-slate-600"><li><a href="#abstract" className="hover:text-[#0F294A]">Abstract / Tóm tắt</a></li>{sections.map((section, index) => <li key={section.id}><a href={`#section-${index + 1}`} className="block break-words hover:text-[#0F294A]">{index + 1}. {section.title}</a></li>)}</ol></nav>;
}
