import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUserUpload } from '@/lib/permissions';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ItemForm } from '@/components/item-form';

export const dynamic = 'force-dynamic';

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

  const [members, categories] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
    prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        layoutType: true,
        description: true,
        isNavFeatured: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-5xl flex-1">
        <header className="mb-6 pb-5 border-b border-slate-200">
          <div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Hiệu chỉnh bài nộp
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {item.status === 'REJECTED' ? 'Chỉnh sửa & Gửi lại xét duyệt' : 'Chỉnh sửa công trình'}
              </h1>
              <p className="text-sm text-slate-600 truncate max-w-3xl mt-1">
                {item.status === 'REJECTED'
                  ? 'Cập nhật lại thông tin công trình theo góp ý của ban kiểm duyệt trước khi gửi lại.'
                  : 'Cập nhật thông tin, tác giả và tài liệu của công trình nghiên cứu.'}
              </p>
            </div>
          </div>
        </header>

        <ItemForm
          currentUserId={user.id}
          currentUserRole={user.role}
          clubMembers={members}
          categories={categories}
          initialData={item}
          isEdit={true}
        />
      </main>

      <AcademicFooter />
    </div>
  );
}
