import { ChangePasswordForm } from '@/features/identity/components/change-password-form';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { getSession as auth } from '@/features/identity/server/session';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Đổi mật khẩu | CLB Robotics & IoT',
};

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <>

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 flex-1 flex flex-col">
        <Breadcrumbs items={[{ label: 'Hồ sơ của tôi', href: `/members/${session.user.id}` }, { label: 'Đổi mật khẩu' }]} />
        <div className="flex flex-1 items-center justify-center"><ChangePasswordForm /></div>
      </main>

    </>
  );
}
