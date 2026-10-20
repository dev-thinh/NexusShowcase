'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction } from '@/actions/admin-actions';
import { Role } from '@prisma/client';
import { Loader2, ArrowUpCircle, ArrowDownCircle, ShieldCheck, Shield } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

export function AdminRoleToggle({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleCoreMember = async () => {
    const nextRole = currentRole === 'CORE_MEMBER' ? 'MEMBER' : 'CORE_MEMBER';
    setLoading(true);
    await updateUserRoleAction(userId, nextRole);
    setLoading(false);
    router.refresh();
  };

  const setRole = async (newRole: Role) => {
    setLoading(true);
    await updateUserRoleAction(userId, newRole);
    setLoading(false);
    router.refresh();
  };

  if (currentRole === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
        <span>Toàn quyền</span>
      </span>
    );
  }

  const isCore = currentRole === 'CORE_MEMBER';

  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={loading}
        onClick={toggleCoreMember}
        className={`inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] disabled:opacity-50 ${
          isCore
            ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            : 'bg-brand-button hover:brightness-110 text-white'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isCore ? (
          <ArrowDownCircle className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpCircle className="w-3.5 h-3.5 text-white/80" />
        )}
        <span>{isCore ? 'Thu quyền đăng bài' : 'Cấp quyền đăng bài'}</span>
      </button>

      <Tooltip
        content={
          isCore
            ? 'Thành viên này hiện đang có quyền nộp bài và quản lý công trình đại diện nhóm.'
            : 'Cấp quyền CORE MEMBER để thành viên này có thể đăng ký công trình và gửi xét duyệt.'
        }
      />
    </div>
  );
}
