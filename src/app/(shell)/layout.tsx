import { PublicSectionProvider } from '@/shared/navigation/public-section-context';
import { SiteNavbar } from './_components/navbar';
import { NavigationContent } from '@/shared/navigation/navigation-content';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <PublicSectionProvider><div className="flex min-h-screen flex-col bg-background font-sans"><SiteNavbar /><NavigationContent>{children}</NavigationContent></div></PublicSectionProvider>;
}
