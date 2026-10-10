import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AdminRoleToggle } from '@/components/admin-role-toggle';
import Link from 'next/link';

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/');

  const members = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 inline-block">
          ← Quay lại bàn làm việc
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Quản lý Thành viên CLB</h1>
        <p className="text-sm text-slate-500 mb-6">
          Thầy có thể nâng cấp các bạn sinh viên nòng cốt lên <strong>Core Member</strong> để các bạn có quyền nộp bài cho nhóm.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Họ và Tên</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Vai trò hiện tại</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{member.fullName}</td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        member.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800'
                          : member.role === 'CORE_MEMBER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AdminRoleToggle
                      adminId={session.user.id}
                      userId={member.id}
                      currentRole={member.role}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
