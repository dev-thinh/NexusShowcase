
import { getServerI18n } from '@/shared/i18n/server';
import { ClubLogo } from '@/shared/ui/club-logo';
import { NavbarNav, PublicNavigation } from '@/app/(shell)/_components/navbar-nav';
import { getSession as auth } from '@/features/identity/server/session';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { Suspense } from 'react';
import { prisma } from '@/server/db/prisma';
import { Skeleton } from '@/shared/ui/skeleton';
import { LanguageSwitch } from '@/shared/i18n/language-switch';

export async function SiteNavbar() {
  const { t: tr } = await getServerI18n();


  return (
    <header id="site-navbar" className="sticky top-0 z-40 bg-white backdrop-blur-md border-b border-slate-200 transition-all shadow-2xs w-full">
      <div className="site-navbar-grid relative w-full px-4 sm:px-6 lg:px-8 xl:px-10 min-h-16 py-3 xl:py-0 gap-y-2 grid grid-cols-[minmax(0,1fr)_auto_auto] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        {/* Góc trên bên trái: Brand Logo */}
        <div className="site-brand-container col-start-1 row-start-1 flex items-center justify-self-start min-w-0">
          <Link
            href="/"
            className="site-brand block min-w-0 w-[136px] max-w-full rounded-sm sm:w-[180px]"
            aria-label={tr("Trang chủ CLB Robotics & IoT - HCMUS")}
          >
            <ClubLogo />
          </Link>
        </div>

        {/* Các tab ở giữa & Profile/Đăng xuất bên phải */}
        <PublicNavigation />
        <div className="site-account-controls col-start-3 row-start-1 flex items-center justify-self-end gap-2"><LanguageSwitch />
        <Suspense fallback={<div className="site-account-placeholder col-start-3 row-start-1 flex h-10 w-20 items-center justify-center gap-2 justify-self-end sm:w-36" role="status" aria-busy="true" aria-label={tr("Đang tải tài khoản")}><span className="sr-only">{tr("Đang tải tài khoản…")}</span><Skeleton className="h-6 w-6 shrink-0 rounded-full" /><Skeleton className="hidden h-4 w-16 sm:block" /></div>}>
          <AccountNavigation />
        </Suspense>
        </div>
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
