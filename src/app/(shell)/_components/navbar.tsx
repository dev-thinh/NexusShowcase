import { ClubLogo } from '@/shared/ui/club-logo';
import { NavbarNav, PublicNavigation } from '@/app/(shell)/_components/navbar-nav';
import { getSession as auth } from '@/features/identity/server/session';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { Suspense } from 'react';
import { prisma } from '@/server/db/prisma';

export function SiteNavbar() {

  return (
    <header id="site-navbar" className="sticky top-0 z-40 bg-white backdrop-blur-md border-b border-slate-200 transition-all shadow-2xs w-full">
      <div className="site-navbar-grid relative w-full px-4 sm:px-6 lg:px-8 xl:px-10 min-h-16 py-3 xl:py-0 gap-y-2 grid grid-cols-[minmax(0,1fr)_auto_auto] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        {/* Góc trên bên trái: Brand Logo */}
        <div className="col-start-1 row-start-1 col-span-2 xl:col-span-1 max-xl:pr-3 flex items-center justify-self-start min-w-0">
          <Link
            href="/"
            className="site-brand block min-w-0 w-[170px] max-w-full rounded-sm sm:w-56"
            aria-label="Trang chủ CLB Robotics & IoT - HCMUS"
          >
            <ClubLogo />
          </Link>
        </div>

        {/* Các tab ở giữa & Profile/Đăng xuất bên phải */}
        <PublicNavigation />
        <Suspense fallback={<div className="col-start-3 row-start-1 h-10 w-20 sm:w-36 justify-self-end rounded-md bg-[#FFFFFF]" aria-busy="true" aria-label="Đang tải tài khoản" />}>
          <AccountNavigation />
        </Suspense>
      </div>
    </header>
  );
}

export async function AccountNavigation() {
  const session = await auth();
  const user = session?.user;
  const member = user ? await prisma.user.findUnique({ where: { id: user.id }, select: { publicSlug: true, fullName: true, avatarUrl: true } }) : null;
  return <NavbarNav user={user && member ? { id: user.id, publicSlug: member.publicSlug, name: member?.fullName ?? user.name, avatarUrl: member?.avatarUrl, role: user.role ?? 'GUEST' } : null} />;
}
