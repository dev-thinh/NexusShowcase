import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ItemForm } from '@/components/item-form';
import { canUserUpload } from '@/lib/permissions';

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !canUserUpload(user)) {
    redirect('/dashboard');
  }
  if (user.mustChangePassword) {
    redirect('/account/change-password');
  }

  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Đăng tải công trình / dự án mới</h1>
        <p className="text-sm sm:text-base text-slate-600 mb-8">
          Điền thông tin đề tài, chọn các tác giả tham gia và gửi để ban quản trị xét duyệt xuất bản.
        </p>

        <ItemForm currentUserId={user.id} currentUserRole={user.role} clubMembers={members} />
      </main>

      <AcademicFooter />
    </div>
  );
}
