import { getSession } from '@/features/identity/server/session';
import { AcademicFooter } from '@/shared/ui/academic-footer';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSession())?.user?.id) redirect('/login');
  return <>{children}<AcademicFooter /></>;
}
