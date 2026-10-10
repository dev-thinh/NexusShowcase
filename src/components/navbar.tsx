import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Compass, LayoutDashboard, Shield, LogIn, Sparkles, BookOpen } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

export async function Navbar() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:shadow group-hover:scale-105 transition-all duration-200">
            <Sparkles className="w-5 h-5 text-blue-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              NexusShowcase
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1">
              HCMUS Academic Lab
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Compass className="w-4 h-4" />
            <span>Khám phá</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-800 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Avatar Chip */}
              <Link
                href={`/members/${user.id}`}
                className="ml-1 flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                title="Trang cá nhân của bạn"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
              </Link>

              {/* Sign Out Button */}
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold shadow-xs hover:shadow transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
