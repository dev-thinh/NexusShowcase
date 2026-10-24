import { ArrowRight, type LucideIcon } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import type { ReactNode } from 'react';

export function ManagementHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
    <div className="min-w-0"><span className="page-eyebrow">Quản lý tài khoản</span><h1 className="page-title">{title}</h1><p className="mt-2 text-sm leading-6 text-[#1F2937]">{description}</p></div>
    {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
  </header>;
}

export { ManagementNav } from './management-nav';

export function ManagementStat({ label, value, icon: Icon, href, attention = false }: { label: string; value: number; icon: LucideIcon; href?: string; attention?: boolean }) {
  const content = <><div className="flex min-h-10 items-start justify-between gap-2 sm:min-h-0"><span className="text-xs leading-5 text-[#1F2937] sm:text-sm">{label}</span><Icon aria-hidden="true" className={`hidden h-4 w-4 shrink-0 sm:block ${attention ? 'text-[#1F2937]' : 'text-[#1F2937]'}`} /></div><div className="mt-3 flex items-end justify-between gap-2"><span className={`text-2xl font-semibold tabular-nums sm:text-3xl ${attention ? 'text-[#1F2937]' : 'text-[#1F2937]'}`}>{value}</span>{href && <ArrowRight aria-hidden="true" className="mb-1 h-4 w-4 text-[#1F2937]" />}</div></>;
  const className = `panel-operational !p-3 !shadow-none sm:!p-4 ${href ? 'transition-colors hover:border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]' : ''}`;
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}
