import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ChangePasswordForm } from '@/components/change-password-form';

export const metadata = {
  title: 'Đổi mật khẩu | Robotics & IoT Lab',
};

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <ChangePasswordForm />
      </main>
      <AcademicFooter />
    </div>
  );
}
