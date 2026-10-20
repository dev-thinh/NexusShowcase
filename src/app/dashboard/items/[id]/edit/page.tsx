import { notFound, redirect } from 'next/navigation';
import { getSession as auth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { canUserUpload } from '@/lib/permissions';
import { getAuthorDraft } from '@/lib/direct-review';
import { mapShowcaseItemToSubmission } from '@/lib/submission-types';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { SubmissionEditor } from '@/components/submission/submission-editor';

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

  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  const categories = await prisma.category.findMany({ where: { slug: { in: ['bai-bao-khoa-hoc', 'robotics-iot'] } }, select: { id: true, name: true, slug: true } });
  const draft = getAuthorDraft(item.authorDraft);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="w-full">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{item.status === 'PUBLISHED' ? 'Soạn bản cập nhật' : item.status === 'REVISION_REQUESTED' ? 'Chỉnh sửa theo phản hồi' : 'Chỉnh sửa bản nháp'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Bản cập nhật chỉ xuất hiện công khai sau khi được Admin duyệt. Bài đang hiển thị được giữ nguyên.</p>
          </header>
          <SubmissionEditor initialData={draft ? { ...draft, id: item.id } : mapShowcaseItemToSubmission(item)} currentUser={{ id: user.id, fullName: user.fullName, role: user.role }} clubMembers={members} categories={categories} mode="edit" reviewComments={item.reviewComments} />
        </div>
      </main>
      <AcademicFooter />
    </div>
  );
}
