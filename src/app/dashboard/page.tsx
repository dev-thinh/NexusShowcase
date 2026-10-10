import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { canUserUpload } from '@/lib/permissions';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin');

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      createdItems: {
        orderBy: { createdAt: 'desc' },
      },
      contributions: {
        include: { item: true },
      },
    },
  });

  if (!user) redirect('/api/auth/signin');

  const isUploader = canUserUpload(user);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển thành viên</h1>
            <p className="text-sm text-slate-500">Xin chào, {user.fullName} ({user.role})</p>
          </div>

          {isUploader ? (
            <Link
              href="/dashboard/items/new"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2 self-start"
            >
              + Đăng tải bài mới cho nhóm
            </Link>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-md">
              💡 Bạn đang là thành viên thường. Để đăng bài đại diện cho nhóm nghiên cứu, vui lòng liên hệ Thầy chủ nhiệm để được nâng cấp lên <strong>Core Member</strong>.
            </div>
          )}
        </div>

        {/* Danh sách bài do thành viên tạo */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Các bài bạn đã khởi tạo ({user.createdItems.length})</h2>
          {user.createdItems.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Bạn chưa tạo bài viết nào.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {user.createdItems.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Năm: {item.publishedYear}</span>
                      <span>•</span>
                      <span>Loại: {item.type}</span>
                    </div>
                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="mt-2 p-2 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <strong>Lý do từ chối:</strong> {item.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
