'use client';

import { useState, useRef, useEffect } from 'react';
import { NavigationLink as Link } from '@/components/navigation-link';
import { useNavigationPathname as usePathname } from '@/components/navigation-transition';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  CheckSquare,
  ChevronDown,
  User,
  Plus,
} from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';
import { canUserReview, canUserUpload } from '@/lib/permissions';

interface NavbarNavProps {
  user?: {
    id: string;
    name?: string | null;
    role: string;
  } | null;
}

export function NavbarNav({ user }: NavbarNavProps) {
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Close the account disclosure when focus or a pointer moves outside it.
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
        profileButtonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('focusin', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsProfileMenuOpen(false);
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
    'h-9 px-3 sm:px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-brand-button text-white shadow-xs transition-all duration-150 shrink-0';

  // Standard uniform inactive panel class (nguyên bản chuẩn đẹp ban đầu)
  const inactiveTabClass =
    'h-9 px-3 sm:px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150 shrink-0';

  return (
    <>
      {/* Public navigation; personal actions are grouped in the profile dropdown. */}
      <nav className="hidden sm:flex col-start-2 row-start-1 justify-self-center max-xl:col-start-1 max-xl:col-span-3 max-xl:row-start-2 max-xl:flex-wrap max-xl:justify-center items-center gap-1.5 sm:gap-2 z-10 pointer-events-auto">
        {/* 1. Tab: Trang chủ */}
        <Link
          href="/"
          className={isExploreActive ? activeTabClass : inactiveTabClass}
          aria-current={isExploreActive ? 'page' : undefined}
        >
          <span>Trang chủ</span>
        </Link>

        {[
          { slug: 'bai-bao-khoa-hoc', name: 'Nghiên cứu khoa học' },
          { slug: 'robotics-iot', name: 'Robotics & IoT' },
        ].map(({ slug, name }) => {
          const active = pathname === `/category/${slug}`;
          return (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className={active ? activeTabClass : inactiveTabClass}
              aria-current={active ? 'page' : undefined}
            >
              <span>{name}</span>
            </Link>
          );
        })}

        {/* 2. Tab: Thành viên */}
        <Link
          href="/members"
          className={isMembersActive ? activeTabClass : inactiveTabClass}
          aria-current={isMembersActive ? 'page' : undefined}
        >
          <span>Thành viên</span>
        </Link>

        {/* 5. Tab: Liên hệ */}
        <Link
          href="/contact"
          className={isContactActive ? activeTabClass : inactiveTabClass}
          aria-current={isContactActive ? 'page' : undefined}
        >
          <span>Liên hệ</span>
        </Link>
      </nav>

      {/* GÓC TRÊN BÊN PHẢI: PROFILE VỚI MENU QUẢN TRỊ & ĐĂNG XUẤT */}
      <div className="col-start-3 row-start-1 justify-self-end flex items-center gap-2 sm:gap-2.5 shrink-0 z-10">
        {user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-expanded={isProfileMenuOpen}
              aria-controls="profile-navigation"
              aria-label={`Menu tài khoản: ${user.name || 'Thành viên'}`}
              className={`h-10 px-2.5 sm:px-3 rounded-lg inline-flex items-center gap-2 text-sm border shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] focus-visible:ring-offset-2 ${
                isAdminActive || isProfileActive || isDashboardActive
                  ? 'bg-brand-button text-white border-transparent'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <span aria-hidden="true" className="w-6 h-6 rounded-full bg-slate-100 text-[#0F294A] flex items-center justify-center text-xs font-semibold shrink-0">
                {user.name?.charAt(0) || 'U'}
              </span>
              <span className="truncate max-w-[65px] sm:max-w-[110px] font-semibold">
                {user.name || 'Thành viên'}
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {{ ADMIN: 'Admin', CORE_MEMBER: 'Core', MEMBER: 'Member', GUEST: 'Khách' }[user.role] || 'Thành viên'}
              </span>
              <ChevronDown aria-hidden="true" className={`w-3.5 h-3.5 shrink-0 transition-transform motion-reduce:transition-none ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileMenuOpen && (
              <nav
                id="profile-navigation"
                aria-label="Chức năng tài khoản"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('a')) setIsProfileMenuOpen(false);
                }}
                className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50"
              >
                {[
                  ...(user.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin Dashboard', icon: ShieldCheck }] : []),
                  ...(canUserReview(user) ? [{ href: '/admin/reviews', label: 'Phê duyệt', icon: CheckSquare }] : []),
                  ...(user.role === 'ADMIN' ? [{ href: '/admin/members', label: 'Quản lý thành viên', icon: Users }] : []),
                  { href: '/dashboard', label: 'Bài đăng của tôi', icon: LayoutDashboard },
                  ...(canUserUpload(user) ? [{ href: '/dashboard/items/new', label: 'Đăng bài mới', icon: Plus }] : []),
                  { href: `/members/${user.id}`, label: 'Hồ sơ của tôi', icon: User },
                ].map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2.5 min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F294A] ${active ? 'bg-slate-100 text-[#0F294A]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <SignOutButton variant="menu" />
                </div>
              </nav>
            )}
          </div>
        ) : (
          /* Khách: Nút Đăng nhập */
          <Link
            href="/login"
            className={
              isLoginActive
                ? activeTabClass
                : 'h-9 px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-brand-button hover:brightness-110 text-white shadow-xs transition-colors'
            }
            aria-current={isLoginActive ? 'page' : undefined}
          >
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </>
  );
}
