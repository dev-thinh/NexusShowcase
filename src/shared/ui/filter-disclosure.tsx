'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export function FilterDisclosure({ children, count = 0, className = '' }: { children: ReactNode; count?: number; className?: string }) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  return <>
    <div id={id} className={`col-span-full gap-3 border-t border-slate-200 pt-3 md:contents ${expanded ? `grid ${className}` : 'hidden'}`}>{children}</div>
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)} className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-[#153D67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] md:hidden">
      <SlidersHorizontal aria-hidden="true" className="h-4 w-4" /> Bộ lọc
      {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#153D67] px-1 text-xs text-white">{count}</span>}
      <ChevronDown aria-hidden="true" className={`hidden h-4 w-4 transition-transform sm:block duration-200 ${expanded ? 'rotate-180' : ''}`} />
    </button>
  </>;
}
