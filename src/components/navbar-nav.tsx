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
  User,
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
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target as Node)
      ) {
        setIsAdminMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsAdminMenuOpen(false);
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

  // Standard uniform active panel class (Dark Navy #0F294A)
  const activeTabClass =
    'h-9 px-3 sm:px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#0F294A] text-white shadow-xs transition-all duration-150 shrink-0';

  // Standard uniform inactive panel class (nguyên bản chuẩn đẹp ban đầu)
  const inactiveTabClass =
    'h-9 px-3 sm:px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150 shrink-0';

  return (
    <>
      {/* 
        CÁC TAB CĂN GIỮA TUYỆT ĐỐI (DEAD CENTER - TINH GỌN CHUẨN ĐẸP)
        Thứ tự chuẩn hóa: Trang chủ -> Thành viên -> Bài đăng (khi đăng nhập) -> Liên hệ
        (3 chuyên mục nghiên cứu & dự án được khám phá trực tiếp trên Trang chủ với giao diện chuyên biệt)
      */}
      <nav className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center gap-1.5 sm:gap-2 z-10 pointer-events-auto">
        {/* 1. Tab: Trang chủ */}
        <Link
          href="/"
          className={isExploreActive ? activeTabClass : inactiveTabClass}
          aria-current={isExploreActive ? 'page' : undefined}
        >
          <Compass className={`w-4 h-4 shrink-0 ${isExploreActive ? 'text-white' : 'text-slate-400'}`} />
          <span>Trang chủ</span>
        </Link>

        {/* 2. Tab: Thành viên */}
        <Link
          href="/members"
          className={isMembersActive ? activeTabClass : inactiveTabClass}
          aria-current={isMembersActive ? 'page' : undefined}
        >
          <Users className={`w-4 h-4 shrink-0 ${isMembersActive ? 'text-white' : 'text-slate-400'}`} />
          <span>Thành viên</span>
        </Link>

        {/* 3. Tab: Bài đăng (Chỉ hiển thị cho thành viên đã đăng nhập: MEMBER, CORE_MEMBER, ADMIN) */}
        {user && (
          <Link
            href="/dashboard"
            className={isDashboardActive ? activeTabClass : inactiveTabClass}
            aria-current={isDashboardActive ? 'page' : undefined}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isDashboardActive ? 'text-white' : 'text-slate-400'}`} />
            <span>Bài đăng</span>
          </Link>
        )}

        {/* 5. Tab: Liên hệ */}
        <Link
          href="/contact"
          className={isContactActive ? activeTabClass : inactiveTabClass}
          aria-current={isContactActive ? 'page' : undefined}
        >
          <Mail className={`w-4 h-4 shrink-0 ${isContactActive ? 'text-white' : 'text-slate-400'}`} />
          <span>Liên hệ</span>
        </Link>
      </nav>

      {/* GÓC TRÊN BÊN PHẢI: PROFILE VỚI MENU QUẢN TRỊ & ĐĂNG XUẤT */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 z-10 ml-auto">
        {user ? (
          <>
            {user.role === 'ADMIN' ? (
              /* Dành cho Quản trị viên: Thẻ Profile tích hợp Menu thả Quản trị */
              <div className="relative" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                  className={`h-9 px-2.5 sm:px-3 rounded-lg inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs shrink-0 cursor-pointer ${
                    isAdminActive || isProfileActive
                      ? 'bg-[#0F294A] text-white border-transparent shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                  aria-expanded={isAdminMenuOpen}
                  aria-haspopup="true"
                  title="Menu Quản trị viên & Hồ sơ"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isAdminActive || isProfileActive ? 'bg-white text-[#0F294A]' : 'bg-[#0F294A] text-white'
                    }`}
                  >
                    {user.name?.charAt(0) || 'U'}
                  </div>

                  <span className="truncate max-w-[65px] sm:max-w-[85px] md:max-w-[95px] font-medium leading-none">
                    {user.name || 'Admin'}
                  </span>

                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                    Admin
                  </span>

                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
                      isAdminMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Quản trị viên thả xuống góc phải, không bao giờ che thanh navigate */}
                {isAdminMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in slide-from-top-2 duration-150">
                    <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 rounded-md mb-1 border border-amber-200/60 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Khu vực Quản trị</span>
                    </div>

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

                    <div className="border-t border-slate-100 my-1 pt-1">
                      <Link
                        href={`/members/${user.id}`}
                        className={`flex items-center gap-2 p-2 rounded-md text-xs font-semibold transition-colors ${
                          isProfileActive
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Xem hồ sơ của tôi</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Dành cho Thành viên thông thường: Link trực tiếp tới hồ sơ cá nhân */
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

                <span className="truncate max-w-[65px] sm:max-w-[85px] md:max-w-[95px] font-medium leading-none">
                  {user.name || 'Thành viên'}
                </span>

                {user.role === 'CORE_MEMBER' ? (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80">
                    Core
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                    Member
                  </span>
                )}
              </Link>
            )}

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
      </div>

      {/* Nút lối tắt nổi Quản trị viên (Floating Quick Access) ở góc dưới bên phải màn hình */}
      {user?.role === 'ADMIN' && (
        <aside className="fixed bottom-5 right-5 z-40 print:hidden animate-in fade-in duration-200" aria-label="Lối tắt Quản trị">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0F294A] hover:bg-[#1E3A5F] text-amber-300 hover:text-amber-200 border border-slate-700/80 shadow-lg hover:shadow-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 group"
            title="Lối tắt mở Bàn làm việc Quản trị"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Khu vực Quản trị</span>
          </Link>
        </aside>
      )}
    </>
  );
}
