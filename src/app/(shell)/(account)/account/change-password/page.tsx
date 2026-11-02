import { getSession as auth } from '@/features/identity/server/session';
import { prisma } from '@/server/db/prisma';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Đổi mật khẩu | CLB Robotics & IoT',
};

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id, status: 'ACTIVE', deletedAt: null }, select: { id: true } });
  if (!user) redirect('/login');
  redirect(`/members/${user.id}?password=change`);
}
