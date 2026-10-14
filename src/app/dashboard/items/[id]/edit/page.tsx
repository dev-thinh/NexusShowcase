import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUserUpload } from '@/lib/permissions';
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
  if (!['DRAFT', 'REVISION_REQUESTED'].includes(item.status)) redirect('/dashboard');

  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-4xl">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{item.status === 'REVISION_REQUESTED' ? 'Chỉnh sửa theo phản hồi' : 'Chỉnh sửa bản nháp'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Nội dung chỉ được cập nhật khi còn là bản nháp hoặc khi ban biên tập yêu cầu chỉnh sửa.</p>
          </header>
          <SubmissionEditor initialData={mapShowcaseItemToSubmission(item)} currentUser={{ id: user.id, fullName: user.fullName, role: user.role }} clubMembers={members} mode="edit" reviewComments={item.reviewComments} />
        </div>
      </main>
      <AcademicFooter />
    </div>
  );
}
