import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ItemForm } from '@/components/item-form';
import { canUserUpload } from '@/lib/permissions';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;

  const item = await prisma.showcaseItem.findUnique({
    where: { id },
    include: {
      contributors: {
        orderBy: { displayOrder: 'asc' },
      },
      links: true,
      attachments: true,
    },
  });

  if (!item) {
    notFound();
  }

  const isAdmin = user.role === 'ADMIN';
  if (!isAdmin && item.creatorId !== user.id) {
    redirect('/dashboard');
  }

  if (!isAdmin && item.status === 'PUBLISHED') {
    redirect('/dashboard');
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 font-serif">
            {item.status === 'REJECTED' ? 'Chỉnh sửa & Gửi lại xét duyệt' : 'Chỉnh sửa công trình'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {item.status === 'REJECTED'
              ? 'Cập nhật lại thông tin công trình theo góp ý của ban kiểm duyệt trước khi gửi lại.'
              : 'Cập nhật thông tin, tác giả và tài liệu của công trình nghiên cứu.'}
          </p>
        </div>

        <ItemForm
          currentUserId={user.id}
          currentUserRole={user.role}
          clubMembers={members}
          initialData={item}
          isEdit={true}
        />
      </main>

      <AcademicFooter />
    </div>
  );
}
