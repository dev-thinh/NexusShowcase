import { SiteNavbar } from './_components/navbar';
import { NavigationContent } from '@/shared/navigation/navigation-content';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-background font-sans"><SiteNavbar /><NavigationContent>{children}</NavigationContent></div>;
}
