'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  LayoutDashboard,
  ShieldCheck,
  LogIn,
  Users,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

interface NavbarNavProps {
  user?: {
    id: string;
    name?: string | null;
    role: string;
  } | null;
}

export function NavbarNav({ user }: NavbarNavProps) {
  const pathname = usePathname();
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdminDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsAdminDropdownOpen(false);
  }, [pathname]);

  const isExploreActive = pathname === '/';
  const isDashboardActive = pathname.startsWith('/dashboard');
  const isAdminActive =
    pathname === '/admin' ||
    pathname.startsWith('/admin/reviews') ||
    pathname.startsWith('/admin/members');
  const isProfileActive = user ? pathname === `/members/${user.id}` : false;
  const isLoginActive = pathname === '/login';

  // Standard uniform active panel class
  const activeTabClass =
    'h-10 px-3.5 sm:px-4 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#1A426F] text-white border border-[#28578E] shadow-xs transition-all duration-150';

  // Standard uniform inactive panel class
  const inactiveTabClass =
    'h-10 px-3.5 sm:px-4 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#1A426F] hover:bg-slate-100 border border-transparent transition-all duration-150';

  return (
    <div className="flex flex-1 items-center justify-between ml-4 sm:ml-8 lg:ml-12">
      {/* CÁC TAB Ở GIỮA (CENTER NAVIGATION TABS) */}
      <nav className="flex-1 flex items-center justify-center gap-2 sm:gap-2.5">
        {/* Tab: Khám phá */}
        <Link
          href="/"
          className={isExploreActive ? activeTabClass : inactiveTabClass}
          aria-current={isExploreActive ? 'page' : undefined}
        >
          <Compass className={`w-4 h-4 shrink-0 ${isExploreActive ? 'text-blue-200' : 'text-slate-500'}`} />
          <span>Khám phá</span>
        </Link>

        {/* Tab: Dashboard (Dành cho thành viên đã đăng nhập) */}
        {user && (
          <Link
            href="/dashboard"
            className={isDashboardActive ? activeTabClass : inactiveTabClass}
            aria-current={isDashboardActive ? 'page' : undefined}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isDashboardActive ? 'text-blue-200' : 'text-slate-500'}`} />
            <span>Dashboard</span>
          </Link>
        )}

        {/* Menu Thả Quản trị (Dành riêng cho ADMIN) */}
        {user?.role === 'ADMIN' && (
          <div className="relative" ref={adminDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
              className={`h-10 px-3.5 sm:px-4 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all duration-150 border cursor-pointer ${
                isAdminActive
                  ? 'bg-[#1A426F] text-white border-[#28578E] shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              aria-expanded={isAdminDropdownOpen}
              aria-haspopup="true"
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${isAdminActive ? 'text-amber-300' : 'text-amber-600'}`}
              />
              <span>Quản trị</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
                  isAdminDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isAdminDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    pathname === '/admin'
                      ? 'bg-amber-50 text-amber-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Bàn làm việc Thầy Chủ nhiệm</div>
                    <div className="text-[11px] text-slate-500">Tổng quan &amp; công trình ghim</div>
                  </div>
                </Link>

                <Link
                  href="/admin/reviews"
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    pathname.startsWith('/admin/reviews')
                      ? 'bg-amber-50 text-amber-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Thẩm định bài nộp</div>
                    <div className="text-[11px] text-slate-500">Duyệt công trình mới</div>
                  </div>
                </Link>

                <Link
                  href="/admin/members"
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    pathname.startsWith('/admin/members')
                      ? 'bg-amber-50 text-amber-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Quản lý Thành viên</div>
                    <div className="text-[11px] text-slate-500">Phân quyền Core Member</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* GÓC TRÊN BÊN PHẢI: PROFILE & ĐĂNG XUẤT */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {user ? (
          <>
            {/* User Profile Chip */}
            <Link
              href={`/members/${user.id}`}
              className={`h-10 px-3 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs ${
                isProfileActive
                  ? 'bg-[#1A426F] text-white border-[#28578E] shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
              title="Hồ sơ học thuật cá nhân"
              aria-current={isProfileActive ? 'page' : undefined}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isProfileActive ? 'bg-white text-[#1A426F]' : 'bg-[#1A426F] text-white'
                }`}
              >
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate">{user.name}</span>
              {user.role === 'ADMIN' && (
                <span className="hidden xl:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                  Admin
                </span>
              )}
              {user.role === 'CORE_MEMBER' && (
                <span className="hidden xl:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  Core
                </span>
              )}
            </Link>

            {/* Nút Đăng xuất */}
            <SignOutButton />
          </>
        ) : (
          /* Khách: Nút Đăng nhập */
          <Link
            href="/login"
            className={
              isLoginActive
                ? activeTabClass
                : 'h-10 px-4 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#0F294A] hover:bg-[#1A3E6B] text-white shadow-xs transition-colors'
            }
            aria-current={isLoginActive ? 'page' : undefined}
          >
            <LogIn className="w-4 h-4 shrink-0 text-blue-200" />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </div>
  );
}
