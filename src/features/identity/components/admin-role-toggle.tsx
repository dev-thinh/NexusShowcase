'use client';

import { updateUserRoleAction } from '@/features/identity/server/member-actions';
import { Tooltip } from '@/shared/ui/tooltip';
import { Role } from '@prisma/client';
import { ArrowDownCircle, ArrowUpCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { notifySuccess } from '@/shared/dialogs/success';

export function AdminRoleToggle({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCoreMember = async () => {
    const nextRole = currentRole === 'CORE_MEMBER' ? 'MEMBER' : 'CORE_MEMBER';
    setLoading(true);
    setError('');
    try {
      const result = await updateUserRoleAction(userId, nextRole);
      if (!result.success) { setError(result.error); return; }
      router.refresh();
      await notifySuccess(nextRole === 'CORE_MEMBER' ? 'Đã cấp quyền đăng bài cho thành viên.' : 'Đã thu quyền đăng bài của thành viên.');
    } catch { setError('Không cập nhật được quyền. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };



  if (currentRole === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFFFFF] text-[#1F2937] text-xs font-semibold border border-slate-200">
        <ShieldCheck className="w-3.5 h-3.5 text-[#1F2937]" />
        <span>Toàn quyền</span>
      </span>
    );
  }

  const isCore = currentRole === 'CORE_MEMBER';

  return (
    <div className="inline-flex items-center gap-2">
      {error && <p role="alert" className="text-xs text-rose-800">{error}</p>}
      <button
        disabled={loading}
        onClick={toggleCoreMember}
        className={`inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:opacity-50 ${
          isCore
            ? 'bg-white hover:bg-[#FFFFFF] text-[#1F2937] border border-slate-200'
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
