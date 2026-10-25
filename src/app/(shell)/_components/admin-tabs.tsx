'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const tabs = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/reviews', label: 'Phê duyệt' },
  { href: '/admin/members', label: 'Thành viên' },
  { href: '/admin/content', label: 'Nội dung' },
] as const;

export function AdminTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const saved = useRef<Record<string, string>>({});
  const nav = useRef<HTMLElement>(null);
  const query = params.toString();
  useEffect(() => {
    if (tabs.some(tab => tab.href === pathname)) saved.current[pathname] = pathname + (query ? `?${query}` : '');
    const selected = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav.current && selected) {
      const item = selected.getBoundingClientRect(), viewport = nav.current.getBoundingClientRect();
      if (item.left < viewport.left) nav.current.scrollLeft += item.left - viewport.left - 4;
      else if (item.right > viewport.right) nav.current.scrollLeft += item.right - viewport.right + 4;
    }
  }, [pathname, query]);

  return <nav ref={nav} aria-label="Điều hướng quản trị" className="mb-6 flex max-w-full gap-1 overflow-x-auto border-b border-slate-200" data-admin-tabs="true">
    {tabs.map(tab => {
      const active = tab.href === '/admin' ? pathname === tab.href : pathname.startsWith(tab.href + '/') || pathname === tab.href;
      const href = pathname === tab.href ? pathname + (query ? `?${query}` : '') : saved.current[tab.href] ?? tab.href;
      return <Link key={tab.href} href={href} scroll={false} aria-current={active ? 'page' : undefined} aria-controls="admin-tab-content" className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67]/30 sm:px-5 ${active ? 'border-[#153D67] font-semibold text-[#153D67]' : 'border-transparent font-normal text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>{tab.label}</Link>;
    })}
  </nav>;
}
