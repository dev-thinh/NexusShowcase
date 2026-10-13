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
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
        {/* Góc trên bên trái: Brand Logo & Tên */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 group rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C6F]"
            aria-label="Trang chủ Robotics & IoT Lab"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2B4C6F] flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:bg-[#1F3750] transition-colors shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-[#2B4C6F] transition-colors leading-tight">
                Robotics &amp; IoT Lab
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase hidden sm:block">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
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
