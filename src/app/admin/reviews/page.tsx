import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AdminReviewButton } from '@/components/admin-review-button';
import Link from 'next/link';

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/');

  const pendingItems = await prisma.showcaseItem.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      creator: true,
      contributors: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 inline-block">
          ← Quay lại bàn làm việc
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Duyệt bài đăng ({pendingItems.length})</h1>

        {pendingItems.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            Hiện không có bài đăng nào cần duyệt.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div key={item.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-400">Người nộp: {item.creator.fullName}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.summary}</p>
                  <div className="text-xs text-slate-500 mt-2">
                    Tác giả:{' '}
                    {item.contributors
                      .map((c) => c.user?.fullName || c.externalName)
                      .join(', ')}
                  </div>
                </div>

                <AdminReviewButton adminId={session.user.id} itemId={item.id} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
