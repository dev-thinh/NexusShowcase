
'use client';

import { useI18n } from '@/shared/i18n/provider';
import { Github } from 'lucide-react';
import { isGithubUrl } from '@/shared/lib/github-url';

type Resource = { type: string; url: string; label?: string };

export function CardResourceLink({ links }: { links: Resource[]; detailHref: string }) {
  const { t: tr } = useI18n();

  const resources = links.filter((link, index) => link.type !== 'VIDEO_EMBED' && isGithubUrl(link.url) && links.findIndex(other => other.url === link.url) === index);
  if (!resources.length) return null;
  return <div className="flex min-w-0 flex-wrap items-center gap-2" data-card-resources>
    {resources.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
      aria-label={tr("Mã nguồn GitHub: {0}", link.label?.trim() || tr('Mở mã nguồn'))} title={link.label?.trim() || tr("Mã nguồn GitHub")}
      className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#24292f] bg-[#24292f] px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#32383f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24292f] focus-visible:ring-offset-2">
      <Github aria-hidden="true" className="h-3.5 w-3.5" /><span>GitHub</span>
    </a>)}
  </div>;
}
