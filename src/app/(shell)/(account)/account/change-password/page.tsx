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

  redirect(`/members/${session.user.id}?password=change`);
}
