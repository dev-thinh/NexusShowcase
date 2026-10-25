import { NavbarNav, PublicNavigation } from '@/app/(shell)/_components/navbar-nav';
import { getSession as auth } from '@/features/identity/server/session';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { Suspense } from 'react';
import { prisma } from '@/server/db/prisma';

export function SiteNavbar() {

  return (
    <header id="site-navbar" className="sticky top-0 z-40 bg-white backdrop-blur-md border-b border-slate-200 transition-all shadow-2xs w-full">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-10 min-h-16 py-3 xl:py-0 gap-y-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        {/* Góc trên bên trái: Brand Logo & Tên */}
        <div className="col-start-1 row-start-1 col-span-2 xl:col-span-1 max-xl:pr-3 flex items-center justify-self-start min-w-0">
          <Link
            href="/"
            className="site-brand min-w-0 flex items-center gap-3 group rounded-xl p-1"
            aria-label="Trang chủ CLB Robotics & IoT"
          >
            <span
              aria-hidden="true"
              className="h-9 w-6 shrink-0 bg-brand-button sm:h-10 sm:w-7"
              style={{
                maskImage: 'url(/logo.svg)',
                maskSize: 'contain',
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
                WebkitMaskImage: 'url(/logo.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
              }}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-semibold text-base sm:text-lg tracking-tight text-[#1F2937] group-hover:text-[#1F2937] transition-colors leading-tight">
                CLB Robotics &amp; IoT
              </span>
              <span className="block text-[11px] font-semibold uppercase leading-tight tracking-normal text-foreground-muted">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
              </span>
            </div>
          </Link>
        </div>

        {/* Các tab ở giữa & Profile/Đăng xuất bên phải */}
        <PublicNavigation />
        <Suspense fallback={<div className="col-start-3 row-start-1 h-10 w-36 justify-self-end rounded-md bg-[#FFFFFF]" aria-busy="true" aria-label="Đang tải tài khoản" />}>
          <AccountNavigation />
        </Suspense>
      </div>
    </header>
  );
}

export async function AccountNavigation() {
  const session = await auth();
  const user = session?.user;
  const member = user ? await prisma.user.findUnique({ where: { id: user.id }, select: { fullName: true, avatarUrl: true } }) : null;
  return <NavbarNav user={user ? { id: user.id, name: member?.fullName ?? user.name, avatarUrl: member?.avatarUrl, role: user.role ?? 'GUEST' } : null} />;
}
