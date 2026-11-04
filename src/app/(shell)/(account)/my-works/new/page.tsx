import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { canUserUpload } from '@/features/identity/model/permissions';
import { getSession as auth } from '@/features/identity/server/session';
import { NewDraft } from '@/features/submissions/components/new-draft';
import { prisma } from '@/server/db/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canUserUpload(user)) redirect('/my-works');
  if (user.mustChangePassword) redirect('/account/change-password');

  return (
    <>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: "Công trình của tôi", href: "/my-works" }, { label: "Đăng công trình mới" }]} />
        <div className="w-full">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <span className="page-eyebrow">Quản lý công trình</span><h1 className="page-title">Đăng công trình mới</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1F2937]">Bản nháp được tạo ngay và tự động lưu khi bạn soạn thảo.</p>
          </header>
          <NewDraft accountId={user.id} />
        </div>
      </main>

    </>
  );
}
