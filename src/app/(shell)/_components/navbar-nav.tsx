'use client';

import { SignOutButton } from '@/features/identity/components/sign-out-button';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { canUserReview, canUserUpload } from '@/features/identity/model/permissions';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { useNavigationPathname as usePathname, useNavigationVisualPathname } from '@/shared/navigation/navigation-transition';
import {
ChevronDown,
LayoutDashboard,
Plus,
ShieldCheck,
User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NavbarNavProps {
  user?: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
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

  const isDashboardActive = pathname.startsWith('/dashboard');
  const isAdminActive =
    pathname === '/admin' ||
    pathname.startsWith('/admin/reviews') ||
    pathname.startsWith('/admin/members');
  const isProfileActive = user ? pathname === `/members/${user.id}` : false;
  const isLoginActive = pathname === '/login';

  return (
    <>
      {/* Public navigation; personal actions are grouped in the profile dropdown. */}


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
              className={`h-10 px-2.5 sm:px-3 rounded-lg inline-flex items-center gap-2 text-sm border shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 ${
                isAdminActive || isProfileActive || isDashboardActive
                  ? 'bg-brand-button text-white border-transparent'
                  : 'bg-white hover:bg-[#FFFFFF] text-[#1F2937] border-slate-200'
              }`}
            >
              <MemberAvatar fullName={user.name || 'Thành viên'} src={user.avatarUrl} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover text-xs" />
              <span className="truncate max-w-[65px] sm:max-w-[110px] font-semibold">
                {user.name || 'Thành viên'}
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FFFFFF] text-[#1F2937]">
                {{ ADMIN: 'Admin', CORE_MEMBER: 'Core', MEMBER: 'Member', GUEST: 'Khách' }[user.role] || 'Thành viên'}
              </span>
              <ChevronDown aria-hidden="true" className={`w-3.5 h-3.5 shrink-0 transition-transform motion-reduce:transition-none ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Keep links mounted while a navigation is pending: unmounting them
                releases NavigationLink's destination feedback prematurely. */}
              <nav
                id="profile-navigation"
                hidden={!isProfileMenuOpen}
                aria-label="Chức năng tài khoản"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('a')) setIsProfileMenuOpen(false);
                }}
                className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50"
              >
                {[
                  ...(canUserReview(user) ? [{ href: '/admin', label: 'Quản trị', icon: ShieldCheck }] : []),
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
                      className={`flex items-center gap-2.5 min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67] ${active ? 'bg-[#FFFFFF] text-[#1F2937]' : 'text-foreground-muted hover:text-[#1F2937] hover:bg-[#FFFFFF]'}`}
                    >
                      <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-slate-200 mt-1 pt-1">
                  <SignOutButton variant="menu" />
                </div>
              </nav>
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

const activeTabClass =
    'h-9 px-3 sm:px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-brand-button text-white shadow-xs shrink-0';
const inactiveTabClass =
    'h-9 px-3 sm:px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-foreground-muted hover:text-[#1F2937] hover:bg-[#FFFFFF] transition-colors shrink-0';

export function PublicNavigation() {
  const pathname = usePathname();
  const visualPathname = useNavigationVisualPathname();
  const tabClass = (href: string) => visualPathname === href ? activeTabClass : inactiveTabClass;
  const isExploreActive = pathname === '/';
  const isMembersActive = pathname === '/members';
  const isContactActive = pathname === '/contact';
  return (<nav className="flex flex-wrap col-start-2 row-start-1 justify-self-center max-xl:col-start-1 max-xl:col-span-3 max-xl:row-start-2 max-xl:flex-wrap max-xl:justify-center items-center gap-1.5 sm:gap-2 z-10 pointer-events-auto">
        {/* 1. Tab: Trang chủ */}
        <Link
          href="/"
          prefetch={false}
          className={tabClass('/')}
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
              prefetch={false}
              className={tabClass(`/category/${slug}`)}
              aria-current={active ? 'page' : undefined}
            >
              <span>{name}</span>
            </Link>
          );
        })}

        {/* 2. Tab: Thành viên */}
        <Link
          href="/members"
          prefetch={false}
          className={tabClass('/members')}
          aria-current={isMembersActive ? 'page' : undefined}
        >
          <span>Thành viên</span>
        </Link>

        {/* 5. Tab: Liên hệ */}
        <Link
          href="/contact"
          prefetch={false}
          className={tabClass('/contact')}
          aria-current={isContactActive ? 'page' : undefined}
        >
          <span>Liên hệ</span>
        </Link>
      </nav>);
}
