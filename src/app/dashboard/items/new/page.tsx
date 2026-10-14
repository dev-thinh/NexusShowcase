import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { canUserUpload } from '@/lib/permissions';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ItemForm } from '@/components/item-form';

export const dynamic = 'force-dynamic';

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
                Khởi tạo công trình
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Đăng tải công trình / dự án mới
              </h1>
              <p className="text-sm text-slate-600 truncate max-w-3xl mt-1">
                Điền thông tin đề tài, chọn các tác giả tham gia và gửi để ban quản trị xét duyệt xuất bản.
              </p>
            </div>
          </div>
        </header>

        <ItemForm
          currentUserId={user.id}
          currentUserRole={user.role}
          clubMembers={members}
          categories={categories}
        />
      </main>

      <AcademicFooter />
    </div>
  );
}
