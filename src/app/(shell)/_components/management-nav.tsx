'use client';

import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { useEffect, useRef } from 'react';

export function ManagementNav({ active, userId }: { active: 'posts' | 'profile'; userId: string }) {
  const isActive = (id: string, _href: string) => active === id;
  const links = [
    { id: 'posts', href: '/dashboard', label: 'Bài đăng của tôi' },
    { id: 'profile', href: `/members/${userId}`, label: 'Hồ sơ của tôi' },
  ];
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const selected = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && selected) nav.scrollLeft += selected.getBoundingClientRect().left - nav.getBoundingClientRect().left - 8;
  }, [active]);
  return <nav ref={navRef} aria-label="Điều hướng quản lý" className="mb-6 flex max-w-full gap-1 overflow-x-auto border-b border-slate-200 pb-3">
    {links.map(({ id, href, label }) => <Link key={id} href={href} aria-current={isActive(id, href) ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67] ${isActive(id, href) ? 'bg-[#FFFFFF] text-[#1F2937]' : 'text-[#1F2937] hover:bg-[#FFFFFF] hover:text-[#1F2937]'}`}>{label}</Link>)}
  </nav>;
}
