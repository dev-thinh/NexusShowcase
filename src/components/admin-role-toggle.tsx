'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction } from '@/actions/admin-actions';
import { Role } from '@prisma/client';
import { Loader2, ArrowUpCircle, ArrowDownCircle, ShieldCheck } from 'lucide-react';
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

  if (currentRole === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
        <span>Quản trị viên</span>
      </span>
    );
  }

  const isCore = currentRole === 'CORE_MEMBER';

  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={loading}
        onClick={toggleCoreMember}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 ${
          isCore
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-[#2B4C6F] hover:bg-[#1F3750] text-white'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isCore ? (
          <ArrowDownCircle className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpCircle className="w-3.5 h-3.5 text-white/80" />
        )}
        <span>{isCore ? 'Hạ xuống Member' : 'Nâng lên CORE MEMBER'}</span>
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
