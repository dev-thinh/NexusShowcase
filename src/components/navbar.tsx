import Link from 'next/link';
import { getSession as auth } from '@/lib/session';
import { NavbarNav } from '@/components/navbar-nav';

export async function Navbar() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-2xs w-full">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-10 min-h-16 py-3 xl:py-0 gap-y-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        {/* Góc trên bên trái: Brand Logo & Tên */}
        <div className="col-start-1 row-start-1 col-span-2 xl:col-span-1 max-xl:pr-3 flex items-center justify-self-start min-w-0">
          <Link
            href="/"
            className="min-w-0 flex items-center gap-3 group rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
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
              <span className="truncate font-semibold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-[#0F294A] transition-colors leading-tight">
                CLB Robotics &amp; IoT
              </span>
              <span className="block text-xs font-semibold uppercase leading-tight tracking-normal text-slate-500">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
              </span>
            </div>
          </Link>
        </div>

        {/* Các tab ở giữa & Profile/Đăng xuất bên phải */}
        <NavbarNav user={user} />
      </div>
    </header>
  );
}
