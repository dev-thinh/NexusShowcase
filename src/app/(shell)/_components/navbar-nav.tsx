'use client';
import { useI18n } from '@/shared/i18n/provider';


import { publicNavigationSection } from '@/shared/navigation/public-section';
import { usePublicSectionContext } from '@/shared/navigation/public-section-context';
import { SignOutButton } from '@/features/identity/components/sign-out-button';
import { getMemberRoleLabel } from '@/features/identity/model/member-role';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { AVATAR_UPDATED_EVENT, type AvatarUpdate } from '@/shared/lib/avatar-update';
import { canUserReview, canUserUpload } from '@/features/identity/model/permissions';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { useNavigationPathname as usePathname, useNavigationVisualPathname } from '@/shared/navigation/navigation-transition';
import {
ChevronDown,
LayoutDashboard,
Menu,
Plus,
ShieldCheck,
User,
X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NavbarNavProps {
  user?: {
    id: string;
    publicSlug: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: string;
  } | null;
}

export function NavbarNav({ user }: NavbarNavProps) {
  const { t: tr } = useI18n();

  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
  useEffect(() => { setAvatarUrl(user?.avatarUrl); }, [user?.id, user?.avatarUrl]);
  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<AvatarUpdate>).detail;
      if (detail.userId === user?.id) setAvatarUrl(detail.url);
    };
    window.addEventListener(AVATAR_UPDATED_EVENT, update);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, update);
  }, [user?.id]);
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

  const isDashboardActive = pathname.startsWith('/my-works');
  const isAdminActive = pathname === '/admin' || pathname.startsWith('/admin/');
  const isProfileActive = user ? pathname === `/members/${user.id}` : false;
  const isLoginActive = pathname === '/login';

  return (
    <>
      {/* Public navigation; personal actions are grouped in the profile dropdown. */}


      {/* GÓC TRÊN BÊN PHẢI: PROFILE VỚI MENU QUẢN TRỊ & ĐĂNG XUẤT */}
      <div className="site-account-navigation col-start-3 row-start-1 justify-self-end flex items-center gap-2 sm:gap-2.5 shrink-0 z-10">
        {user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-expanded={isProfileMenuOpen}
              aria-controls="profile-navigation"
              aria-label={tr("Menu tài khoản: {0}", user.name || 'Thành viên')}
              className={`h-10 px-2.5 sm:px-3 rounded-lg inline-flex items-center gap-2 text-sm border shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 ${
                isAdminActive || isProfileActive || isDashboardActive
                  ? 'bg-brand-button text-white border-transparent'
                  : 'bg-white hover:bg-[#FFFFFF] text-[#1F2937] border-slate-200'
              }`}
            >
              <MemberAvatar fullName={user.name || tr("Thành viên")} src={avatarUrl} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover text-xs" />
              <span className="hidden xl:block truncate xl:max-w-[110px] font-semibold">
                {user.name || tr("Thành viên")}
              </span>
              <span className="hidden xl:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FFFFFF] text-[#1F2937]">
                {tr(getMemberRoleLabel(user.role))}
              </span>
              <ChevronDown aria-hidden="true" className={`hidden xl:block w-3.5 h-3.5 shrink-0 transition-transform motion-reduce:transition-none ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Keep links mounted while a navigation is pending: unmounting them
                releases NavigationLink's destination feedback prematurely. */}
              <nav
                id="profile-navigation"
                hidden={!isProfileMenuOpen}
                aria-label={tr("Chức năng tài khoản")}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('a')) setIsProfileMenuOpen(false);
                }}
                className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50"
              >
                {[
                  ...(canUserReview(user) ? [{ href: '/admin', label: 'Quản trị', icon: ShieldCheck }] : []),
                  { href: '/my-works', label: 'Công trình của tôi', icon: LayoutDashboard },
                  ...(canUserUpload(user) ? [{ href: '/my-works/new', label: 'Đăng bài mới', icon: Plus }] : []),
                  { href: `/members/${user.id}`, label: 'Hồ sơ của tôi', icon: User },
                ].map(({ href, label, icon: Icon }) => {
                  const active = href === '/admin' ? isAdminActive : pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2.5 min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67] ${active ? 'bg-[#153D67]/10 text-[#153D67]' : 'text-foreground-muted hover:text-[#1F2937] hover:bg-slate-50'}`}
                    >
                      <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                      <span>{tr(label)}</span>
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
            aria-label={tr("Đăng nhập")}
            className={
              isLoginActive
                ? activeTabClass
                : 'h-9 px-3.5 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-brand-button hover:brightness-110 text-white shadow-xs transition-colors'
            }
            aria-current={isLoginActive ? 'page' : undefined}
          >
            <User className="h-5 w-5 xl:hidden" aria-hidden="true" />
            <span className="hidden xl:inline">{tr("Đăng nhập")}</span>
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

const publicLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/research', label: 'Nghiên cứu khoa học' },
  { href: '/projects', label: 'Dự án & Sản phẩm' },
  { href: '/members', label: 'Thành viên' },
  { href: '/contact', label: 'Liên hệ' },
];

export function PublicNavigation() {
  const { t: tr } = useI18n();

  const pathname = usePathname();
  const visualPathname = useNavigationVisualPathname();
  const detail = usePublicSectionContext();
  const activeSection = publicNavigationSection(pathname, detail);
  const visualSection = publicNavigationSection(visualPathname, detail);
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    const change = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', change);
    return () => desktop.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !shellRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [menuOpen]);

  return <div ref={shellRef} className="site-public-navigation-shell">
    <button ref={toggleRef} type="button" className="site-mobile-menu-toggle" aria-expanded={menuOpen} aria-controls="public-navigation" aria-label={menuOpen ? tr("Đóng menu điều hướng") : tr("Mở menu điều hướng")} onClick={() => setMenuOpen(open => !open)}>
      {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
    </button>
    <nav id="public-navigation" aria-label={tr("Điều hướng chính")} data-open={menuOpen ? 'true' : 'false'} className="site-public-navigation flex flex-nowrap col-start-2 row-start-1 justify-self-center items-center gap-1.5 sm:gap-2 z-10 pointer-events-auto" onClick={event => {
      if ((event.target as Element).closest('a')) setMenuOpen(false);
    }}>
      {publicLinks.map(({ href, label }) => <Link key={href} href={href} prefetch={false} className={visualSection === href ? activeTabClass : inactiveTabClass} aria-current={activeSection === href ? (pathname === href ? 'page' : 'location') : undefined}><span>{tr(label)}</span></Link>)}
    </nav>
  </div>;
}
