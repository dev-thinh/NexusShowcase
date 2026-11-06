
'use client';

import { useI18n } from '@/shared/i18n/provider';
import { ArrowUpRight, FileText, Github, Link2 } from 'lucide-react';

export function ResourceCard({ href, title, kind = 'link', fileSize }: {
  href: string;
  title: string;
  kind?: 'link' | 'github' | 'document';
  fileSize?: number;
}) {
  const { t: tr } = useI18n();

  const document = kind === 'document';
  const Icon = document ? FileText : kind === 'github' ? Github : Link2;
  let domain = tr('Liên kết');
  try { domain = new URL(href).hostname.replace(/^www\./, ''); } catch { /* Uploaded files have a relative URL. */ }
  const size = fileSize ? (fileSize < 1024 * 1024 ? `${Math.ceil(fileSize / 1024)} KB` : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`) : '';
  return <a href={href} target="_blank" rel="noopener noreferrer" className="resource-card group relative flex w-fit min-w-0 max-w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-[#153D67]/40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 md:max-w-[33.333333%]">
    <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${document ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-[#153D67]'}`}><Icon className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold leading-6 text-slate-800 group-hover:text-[#153D67]">{title}</span>
      <span className="mt-0.5 block truncate text-xs leading-5 text-slate-500">{document ? [tr('Tài liệu PDF'), size].filter(Boolean).join(' · ') : domain}</span>
    </span>
    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#153D67]" />
    <span aria-hidden="true" className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-[min(24rem,calc(100vw-3rem))] whitespace-normal break-words rounded-lg bg-slate-800 px-3 py-2 text-sm font-normal leading-6 text-white opacity-0 shadow-lg [overflow-wrap:anywhere] group-hover:opacity-100 group-focus-visible:opacity-100">{title}</span>
    <span className="sr-only">{tr(" (mở trong tab mới)")}</span>
  </a>;
}
