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
  Mail,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';
import type { FeaturedNavCategory } from '@/lib/nav-categories';

interface NavbarNavProps {
  user?: {
    id: string;
    name?: string | null;
    role: string;
  } | null;
  featuredCategories?: FeaturedNavCategory[];
}

export function NavbarNav({ user, featuredCategories = [] }: NavbarNavProps) {
  const pathname = usePathname();
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdminDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsAdminDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isExploreActive = pathname === '/';
  const isMembersActive = pathname === '/members';
  const isDashboardActive = pathname.startsWith('/dashboard');
  const isContactActive = pathname === '/contact';
  const isAdminActive =
    pathname === '/admin' ||
    pathname.startsWith('/admin/reviews') ||
    pathname.startsWith('/admin/members');
  const isProfileActive = user ? pathname === `/members/${user.id}` : false;
  const isLoginActive = pathname === '/login';

  // Standard uniform active panel class
  const activeTabClass =
    'h-9 px-2.5 xl:px-3.5 rounded-lg inline-flex items-center justify-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-bold bg-[#0F294A] text-white shadow-xs transition-all duration-150 shrink-0';

  // Standard uniform inactive panel class
  const inactiveTabClass =
    'h-9 px-2.5 xl:px-3.5 rounded-lg inline-flex items-center justify-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150 shrink-0';

  return (
    <div className="flex items-center justify-end lg:justify-between flex-1 min-w-0 gap-2 sm:gap-4">
      {/* 
        CÁC TAB NỘI DUNG Ở GIỮA (FLEX FLOW, KHÔNG BAO GIỜ BỊ OVERLAP BỞI PROFILE HOẶC LOGO)
        Thứ tự chuẩn hóa: Trang chủ -> Thành viên -> Các tab nổi bật -> Bài đăng -> Liên hệ
      */}
      <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1 min-w-0 px-1 overflow-x-auto no-scrollbar">
        {/* 1. Tab: Trang chủ */}
        <Link
          href="/"
          className={isExploreActive ? activeTabClass : inactiveTabClass}
          aria-current={isExploreActive ? 'page' : undefined}
        >
          <Compass className={`w-4 h-4 shrink-0 ${isExploreActive ? 'text-blue-200' : 'text-slate-400'}`} />
          <span>Trang chủ</span>
        </Link>

        {/* 2. Tab: Thành viên */}
        <Link
          href="/members"
          className={isMembersActive ? activeTabClass : inactiveTabClass}
          aria-current={isMembersActive ? 'page' : undefined}
        >
          <Users className={`w-4 h-4 shrink-0 ${isMembersActive ? 'text-blue-200' : 'text-slate-400'}`} />
          <span>Thành viên</span>
        </Link>

        {/* 3. Các tab nổi bật (Admin ghim & có bài > 0, tối đa 3) */}
        {featuredCategories.map((cat) => {
          const isCatActive = pathname === `/category/${cat.slug}`;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={isCatActive ? activeTabClass : inactiveTabClass}
              aria-current={isCatActive ? 'page' : undefined}
            >
              <Layers className={`w-4 h-4 shrink-0 ${isCatActive ? 'text-blue-200' : 'text-slate-400'}`} />
              <span>{cat.name}</span>
            </Link>
          );
        })}

        {/* 4. Tab: Bài đăng (Hiển thị cho tất cả, chuyển hướng login nếu chưa đăng nhập) */}
        <Link
          href={user ? '/dashboard' : '/login?callbackUrl=/dashboard'}
          className={isDashboardActive ? activeTabClass : inactiveTabClass}
          aria-current={isDashboardActive ? 'page' : undefined}
        >
          <LayoutDashboard className={`w-4 h-4 shrink-0 ${isDashboardActive ? 'text-blue-200' : 'text-slate-400'}`} />
          <span>Bài đăng</span>
        </Link>

        {/* 5. Tab: Liên hệ */}
        <Link
          href="/contact"
          className={isContactActive ? activeTabClass : inactiveTabClass}
          aria-current={isContactActive ? 'page' : undefined}
        >
          <Mail className={`w-4 h-4 shrink-0 ${isContactActive ? 'text-blue-200' : 'text-slate-400'}`} />
          <span>Liên hệ</span>
        </Link>
      </nav>

      {/* GÓC BÊN PHẢI: QUẢN TRỊ (NẾU ADMIN), PROFILE & ĐĂNG XUẤT */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 z-10">
        {/* Menu Thả Quản trị (Dành riêng cho ADMIN, đặt bên cạnh Profile để không che các tab điều hướng) */}
        {user?.role === 'ADMIN' && (
          <div className="relative" ref={adminDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
              className={`h-9 px-2.5 sm:px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all duration-150 border cursor-pointer ${
                isAdminActive
                  ? 'bg-[#0F294A] text-white shadow-xs border-transparent'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
              aria-expanded={isAdminDropdownOpen}
              aria-haspopup="true"
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${isAdminActive ? 'text-amber-300' : 'text-slate-500'}`}
              />
              <span className="hidden sm:inline">Quản trị</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
                  isAdminDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isAdminDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in slide-from-top-2 duration-150">
                <Link
                  href="/admin"
                  className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
                    pathname === '/admin'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Bàn làm việc Quản trị</div>
                    <div className="text-[11px] text-slate-500">Tổng quan &amp; công trình ghim</div>
                  </div>
                </Link>

                <Link
                  href="/admin/reviews"
                  className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
                    pathname.startsWith('/admin/reviews')
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Thẩm định bài nộp</div>
                    <div className="text-[11px] text-slate-500">Duyệt công trình mới</div>
                  </div>
                </Link>

                <Link
                  href="/admin/members"
                  className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
                    pathname.startsWith('/admin/members')
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Quản lý Thành viên</div>
                    <div className="text-[11px] text-slate-500">Phân quyền CORE MEMBER</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

        {user ? (
          <>
            {/* User Profile Card với tên gọn gàng & 3 huy hiệu Role chuẩn */}
            <Link
              href={`/members/${user.id}`}
              className={`h-9 px-2.5 sm:px-3 rounded-lg inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs shrink-0 ${
                isProfileActive
                  ? 'bg-[#0F294A] text-white border-transparent shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
              title={`Hồ sơ: ${user.name}`}
              aria-current={isProfileActive ? 'page' : undefined}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isProfileActive ? 'bg-white text-[#0F294A]' : 'bg-[#0F294A] text-white'
                }`}
              >
                {user.name?.charAt(0) || 'U'}
              </div>

              {/* Tên người dùng */}
              <span className="truncate max-w-[65px] sm:max-w-[85px] md:max-w-[95px] font-medium leading-none">
                {user.name || 'Thành viên'}
              </span>

              {/* 3 THẺ ROLE CHUẨN HÓA: Admin, Core, Member */}
              {user.role === 'ADMIN' ? (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                  Admin
                </span>
              ) : user.role === 'CORE_MEMBER' ? (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80">
                  Core
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                  Member
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
                : 'h-9 px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#0F294A] hover:bg-[#1E3A5F] text-white shadow-xs transition-colors'
            }
            aria-current={isLoginActive ? 'page' : undefined}
          >
            <LogIn className="w-4 h-4 shrink-0 text-blue-200" />
            <span>Đăng nhập</span>
          </Link>
        )}

        {/* Nút Hamburger Menu (Mobile & Tablet < lg) */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="lg:hidden h-9 w-9 rounded-lg inline-flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu thả di động / máy tính bảng (< lg) */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-3 sm:p-4 z-50 animate-in fade-in slide-from-top-2 duration-150 space-y-3"
        >
          <div className="space-y-1">
            <Link
              href="/"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                isExploreActive ? 'bg-[#0F294A] text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Trang chủ</span>
            </Link>
            <Link
              href="/members"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                isMembersActive ? 'bg-[#0F294A] text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Thành viên</span>
            </Link>
            {featuredCategories.map((cat) => {
              const isCatActive = pathname === `/category/${cat.slug}`;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    isCatActive ? 'bg-[#0F294A] text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
            <Link
              href={user ? '/dashboard' : '/login?callbackUrl=/dashboard'}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                isDashboardActive ? 'bg-[#0F294A] text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Bài đăng</span>
            </Link>
            <Link
              href="/contact"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                isContactActive ? 'bg-[#0F294A] text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>Liên hệ</span>
            </Link>
          </div>

          {/* Nhóm liên kết Quản trị trong Menu di động */}
          {user?.role === 'ADMIN' && (
            <div className="pt-2.5 border-t border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                Khu vực Quản trị
              </span>
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bàn làm việc Quản trị</span>
              </Link>
              <Link
                href="/admin/reviews"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <CheckSquare className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Thẩm định bài nộp</span>
              </Link>
              <Link
                href="/admin/members"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Quản lý Thành viên</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
