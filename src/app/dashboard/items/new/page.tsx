import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
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

  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng tải công trình / dự án mới</h1>
        <p className="text-sm text-slate-500 mb-8">
          Vui lòng điền thông tin đề tài, chọn các thành viên tham gia cùng và gửi để Thầy chủ nhiệm duyệt.
        </p>

        <ItemForm currentUserId={user.id} clubMembers={members} />
      </main>
    </div>
  );
}
