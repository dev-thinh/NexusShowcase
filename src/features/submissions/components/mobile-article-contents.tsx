'use client';

import { List, X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

export function MobileArticleContents({ children }: { children: ReactNode }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const dismiss = () => {
      if (desktop.matches && panel.current?.matches(':popover-open')) panel.current.hidePopover();
    };
    desktop.addEventListener('change', dismiss);
    return () => desktop.removeEventListener('change', dismiss);
  }, []);

  return <>
    <button type="button" popoverTarget={id} aria-label="Mở mục lục" title="Mục lục" className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#153D67] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 lg:hidden">
      <List aria-hidden="true" className="h-5 w-5" />
    </button>
    <div ref={panel} id={id} popover="auto" role="dialog" aria-label="Mục lục bài viết" onClick={event => {
      if (event.target instanceof Element && event.target.closest('a[href^="#"]')) panel.current?.hidePopover();
    }} className="fixed inset-auto bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 m-0 max-h-[min(65dvh,28rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 text-[#1F2937] shadow-xl lg:hidden [&_nav>h2]:pr-10 [&_ol]:space-y-1 [&_li>a]:flex [&_li>a]:min-h-11 [&_li>a]:items-center [&_li>a]:rounded-lg [&_li>a]:px-2 [&_li>a]:py-2 hover:[&_li>a]:bg-slate-50 focus-visible:[&_li>a]:outline-[#153D67]">
      <button type="button" popoverTarget={id} popoverTargetAction="hide" aria-label="Đóng mục lục" className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]">
        <X aria-hidden="true" className="h-5 w-5" />
      </button>
      {children}
    </div>
  </>;
}
