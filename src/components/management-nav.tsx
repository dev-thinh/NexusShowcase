'use client';

import { useEffect, useRef } from 'react';
import { NavigationLink as Link } from '@/components/navigation-link';

export function ManagementNav({ active, userId, isAdmin = false }: { active: 'overview' | 'members' | 'posts' | 'profile'; userId: string; isAdmin?: boolean }) {
  const isActive = (id: string, _href: string) => active === id;
  const links = [
    ...(isAdmin ? [
      { id: 'overview', href: '/admin', label: 'Tổng quan' },
      { id: 'reviews', href: '/admin/reviews', label: 'Phê duyệt' },
      { id: 'members', href: '/admin/members', label: 'Thành viên' },
    ] : []),
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
    {links.map(({ id, href, label }) => <Link key={id} href={href} aria-current={isActive(id, href) ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F294A] ${isActive(id, href) ? 'bg-blue-50 text-[#0F294A]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>{label}</Link>)}
  </nav>;
}

