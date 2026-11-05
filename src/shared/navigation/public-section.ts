export type PublicSectionContext = { pathname: string; section: '/research' | '/projects' };

export function publicNavigationSection(pathname: string, detail?: PublicSectionContext | null): string {
  if (pathname === '/members' || pathname.startsWith('/members/')) return '/members';
  if (pathname.startsWith('/works/') && detail?.pathname === pathname) return detail.section;
  return pathname;
}
