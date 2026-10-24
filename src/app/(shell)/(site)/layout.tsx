import { AcademicFooter } from '@/shared/ui/academic-footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AcademicFooter /></>;
}
