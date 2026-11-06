'use client';
import { useI18n } from '@/shared/i18n/provider';


import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { useEffect, useRef } from 'react';

export function ManagementNav({ active, userId }: { active: 'posts' | 'profile'; userId: string }) {
  const { t: tr } = useI18n();

  const isActive = (id: string, _href: string) => active === id;
  const links = [
    { id: 'posts', href: '/my-works', label: 'Công trình của tôi' },
    { id: 'profile', href: `/members/${userId}`, label: 'Hồ sơ của tôi' },
  ];
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const selected = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && selected) nav.scrollLeft += selected.getBoundingClientRect().left - nav.getBoundingClientRect().left - 8;
  }, [active]);
  return <nav ref={navRef} aria-label={tr("Điều hướng quản lý")} className="mb-6 flex max-w-full gap-1 overflow-x-auto border-b border-slate-200">
    {links.map(({ id, href, label }) => <Link key={id} href={href} aria-current={isActive(id, href) ? 'page' : undefined} className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67]/30 sm:px-5 ${isActive(id, href) ? 'border-[#153D67] font-semibold text-[#153D67]' : 'border-transparent font-normal text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>{tr(label)}</Link>)}
  </nav>;
}
