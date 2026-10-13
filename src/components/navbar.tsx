import Link from 'next/link';
import { auth } from '@/lib/auth';
import { GraduationCap } from 'lucide-react';
import { NavbarNav } from '@/components/navbar-nav';
import { getFeaturedNavCategories } from '@/lib/nav-categories';

export async function Navbar() {
  const session = await auth();
  const user = session?.user as any;
  const featuredCategories = await getFeaturedNavCategories(!!user);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-2xs w-full">
      <div className="relative w-full px-3 sm:px-4 lg:px-6 xl:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Góc trên bên trái: Brand Logo & Tên */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
            aria-label="Trang chủ NexusShowcase"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0F294A] flex items-center justify-center text-white font-black shadow-xs group-hover:bg-[#1E3A5F] transition-colors shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-[#0F294A] transition-colors leading-tight">
                NexusShowcase
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase hidden 2xl:block">
                Khoa CNTT • ĐH Khoa Học Tự Nhiên
              </span>
            </div>
          </Link>
        </div>

        {/* Các tab ở giữa & Profile/Đăng xuất bên phải */}
        <NavbarNav user={user} featuredCategories={featuredCategories} />
      </div>
    </header>
  );
}
