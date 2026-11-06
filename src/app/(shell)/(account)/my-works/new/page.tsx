import { localizedMetadata } from '@/shared/i18n/metadata';

import { getServerI18n } from '@/shared/i18n/server';
export const generateMetadata = localizedMetadata({ title: 'Đăng bài mới' });

import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { canUserUpload } from '@/features/identity/model/permissions';
import { getSession as auth } from '@/features/identity/server/session';
import { NewDraft } from '@/features/submissions/components/new-draft';
import { prisma } from '@/server/db/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewItemPage() {
  const { t: tr } = await getServerI18n();

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, fullName: true, role: true, mustChangePassword: true } });
  if (!user || !canUserUpload(user)) redirect('/my-works');
  if (user.mustChangePassword) redirect('/account/change-password');
  const categories = await prisma.category.findMany({ where: { slug: { in: ['bai-bao-khoa-hoc', 'robotics-iot'] } }, select: { id: true, name: true, slug: true } });

  return (
    <>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: "Công trình của tôi", href: "/my-works" }, { label: "Đăng công trình mới" }]} />
        <div className="w-full">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <span className="page-eyebrow">{tr("Quản lý công trình")}</span><h1 className="page-title">{tr("Soạn thảo công trình")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1F2937]">{tr("Nội dung được tự động lưu khi bạn soạn thảo.")}</p>
          </header>
          <NewDraft accountId={user.id} currentUser={{ id: user.id, fullName: user.fullName, role: user.role }} categories={categories} />
        </div>
      </main>

    </>
  );
}
