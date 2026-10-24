import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { canUserUpload } from '@/features/identity/model/permissions';
import { selectedContributors } from '@/features/identity/server/selected-contributors';
import { getSession as auth } from '@/features/identity/server/session';
import { SubmissionEditor } from '@/features/submissions/components/submission-editor';
import { getAuthorDraft } from '@/features/submissions/model/draft';
import { mapShowcaseItemToSubmission } from '@/features/submissions/model/snapshot';
import { prisma } from '@/server/db/prisma';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canUserUpload(user)) redirect('/dashboard');
  if (user.mustChangePassword) redirect('/account/change-password');

  const { id } = await params;
  const item = await prisma.showcaseItem.findUnique({
    where: { id },
    include: {
      contributors: { orderBy: { displayOrder: 'asc' } },
      links: true,
      attachments: true,
      reviewComments: {
        where: { audience: 'AUTHOR', status: 'OPEN' },
        select: { id: true, fieldKey: true, body: true, audience: true, severity: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!item) notFound();
  if (item.creatorId !== user.id) redirect('/dashboard');
  if (item.status === 'PUBLISHED' ? ['PENDING_REVIEW', 'READY_FOR_APPROVAL'].includes(item.reviewStatus ?? '') : !['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) redirect('/dashboard');

  const draft = getAuthorDraft(item.authorDraft);
  const members = await selectedContributors((draft?.contributors ?? item.contributors).flatMap(contributor => contributor.userId ? [contributor.userId] : []));

  const categories = await prisma.category.findMany({ where: { slug: { in: ['bai-bao-khoa-hoc', 'robotics-iot'] } }, select: { id: true, name: true, slug: true } });

  return (
    <>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: "Quản lý công trình", href: "/dashboard" }, { label: "Chỉnh sửa công trình" }]} />
        <div className="w-full">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <span className="page-eyebrow">Quản lý công trình</span><h1 className="page-title">{item.status === 'PUBLISHED' ? 'Soạn bản cập nhật' : item.status === 'REVISION_REQUESTED' ? 'Chỉnh sửa theo phản hồi' : 'Chỉnh sửa bản nháp'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1F2937]">Bản cập nhật chỉ xuất hiện công khai sau khi được Admin duyệt. Bài đang hiển thị được giữ nguyên.</p>
          </header>
          <SubmissionEditor initialData={{ ...(draft ?? mapShowcaseItemToSubmission(item)), id: item.id, reviewVersion: item.reviewVersion }} currentUser={{ id: user.id, fullName: user.fullName, role: user.role }} clubMembers={members} categories={categories} mode="edit" reviewComments={item.reviewComments} />
        </div>
      </main>

    </>
  );
}
