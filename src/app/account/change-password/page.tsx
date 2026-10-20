import { getSession as auth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ChangePasswordForm } from '@/components/change-password-form';

export const metadata = {
  title: 'Đổi mật khẩu | CLB Robotics & IoT',
};

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 flex-1 flex items-center justify-center">
        <ChangePasswordForm />
      </main>
      <AcademicFooter />
    </div>
  );
}
