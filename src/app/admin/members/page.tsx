import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AdminRoleToggle } from '@/components/admin-role-toggle';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldCheck, UserCheck, User } from 'lucide-react';

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect('/login');
  }
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const adminId = session.user.id;

  const members = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bàn làm việc</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản lý &amp; Bổ nhiệm Thành viên CLB
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thầy có thể thăng hạng thành viên lên <strong>Core Member</strong> để phân quyền nộp bài cho nhóm.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 self-start">
            {members.length} thành viên
          </span>
        </div>

        {/* Member Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Thành viên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Vai trò hiện tại</th>
                  <th className="px-6 py-4 text-right">Ủy quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.fullName}</div>
                          {member.studentId && (
                            <div className="text-[11px] text-slate-400 font-medium">
                              MSSV: {member.studentId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {member.email}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                          member.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : member.role === 'CORE_MEMBER'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {member.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-amber-600" />}
                        {member.role === 'CORE_MEMBER' && <UserCheck className="w-3 h-3 text-blue-600" />}
                        {member.role === 'MEMBER' && <User className="w-3 h-3 text-slate-500" />}
                        <span>{member.role}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <AdminRoleToggle
                        adminId={adminId}
                        userId={member.id}
                        currentRole={member.role}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
