import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { canUserUpload } from '@/features/identity/model/permissions';
import { getSession as auth } from '@/features/identity/server/session';
import { SubmissionEditor } from '@/features/submissions/components/submission-editor';
import { prisma } from '@/server/db/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canUserUpload(user)) redirect('/dashboard');
  if (user.mustChangePassword) redirect('/account/change-password');

  const members = [{ id: user.id, fullName: user.fullName }];

  const categories = await prisma.category.findMany({ where: { slug: { in: ['bai-bao-khoa-hoc', 'robotics-iot'] } }, select: { id: true, name: true, slug: true } });

  return (
    <>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: "Quản lý công trình", href: "/dashboard" }, { label: "Đăng công trình mới" }]} />
        <div className="w-full">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <span className="page-eyebrow">Quản lý công trình</span><h1 className="page-title">Đăng công trình mới</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1F2937]">Lưu bản nháp chỉ với tiêu đề. Trước khi gửi duyệt, bổ sung tóm tắt và ít nhất một người đóng góp.</p>
          </header>
          <SubmissionEditor initialData={{}} currentUser={{ id: user.id, fullName: user.fullName, role: user.role }} clubMembers={members} categories={categories} mode="create" />
        </div>
      </main>

    </>
  );
}
