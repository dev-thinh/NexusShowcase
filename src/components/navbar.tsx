import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Compass, LayoutDashboard, Shield, LogIn, GraduationCap, BookOpen, Users, CheckSquare } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

export async function Navbar() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all shadow-xs">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0F294A] flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-[#1A3E6B] transition-all duration-200">
            <GraduationCap className="w-5 h-5 text-blue-200" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-[#0F294A] transition-colors leading-tight font-serif">
              NexusShowcase
            </span>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Khoa CNTT • ĐH Khoa Học Tự Nhiên
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-semibold">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-[#0F294A] hover:bg-slate-100/80 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            <span>Khám phá</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'ADMIN' && (
                <>
                  <Link
                    href="/admin/reviews"
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold transition-all duration-150"
                  >
                    <CheckSquare className="w-4 h-4 text-amber-700" />
                    <span>Duyệt bài</span>
                  </Link>

                  <Link
                    href="/admin/members"
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-bold transition-all duration-150"
                  >
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>Thành viên</span>
                  </Link>

                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span>Bàn làm việc</span>
                  </Link>
                </>
              )}

              {/* User Avatar Chip */}
              <Link
                href={`/members/${user.id}`}
                className="ml-1 flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                title="Hồ sơ học thuật của bạn"
              >
                <div className="w-6 h-6 rounded-full bg-[#0F294A] text-white flex items-center justify-center text-[10px] font-extrabold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">{user.name}</span>
              </Link>

              {/* Sign Out Button */}
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F294A] hover:bg-[#1A3E6B] active:scale-95 text-white font-bold shadow-xs hover:shadow transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
            >
              <LogIn className="w-4 h-4 text-blue-200" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
