import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { canUserUpload } from '@/lib/permissions';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { SubmissionEditor } from '@/components/submission/submission-editor';

export const dynamic = 'force-dynamic';

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canUserUpload(user)) redirect('/dashboard');
  if (user.mustChangePassword) redirect('/account/change-password');

  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-6xl">
          <header className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Đăng công trình mới</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Lưu bản nháp chỉ với tiêu đề. Trước khi gửi duyệt, bổ sung tóm tắt và ít nhất một người đóng góp.</p>
          </header>
          <SubmissionEditor initialData={{}} currentUser={{ id: user.id, fullName: user.fullName, role: user.role }} clubMembers={members} mode="create" />
        </div>
      </main>
      <AcademicFooter />
    </div>
  );
}
