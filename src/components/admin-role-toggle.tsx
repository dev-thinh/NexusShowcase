'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction } from '@/actions/admin-actions';
import { Role } from '@prisma/client';
import { Loader2, ArrowUpCircle, ArrowDownCircle, ShieldCheck } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

export function AdminRoleToggle({
  adminId,
  userId,
  currentRole,
}: {
  adminId: string;
  userId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleCoreMember = async () => {
    const nextRole = currentRole === 'CORE_MEMBER' ? 'MEMBER' : 'CORE_MEMBER';
    setLoading(true);
    await updateUserRoleAction(adminId, userId, nextRole);
    setLoading(false);
    router.refresh();
  };

  if (currentRole === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
        <span>Thầy Chủ Nhiệm</span>
      </span>
    );
  }

  const isCore = currentRole === 'CORE_MEMBER';

  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={loading}
        onClick={toggleCoreMember}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
          isCore
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isCore ? (
          <ArrowDownCircle className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpCircle className="w-3.5 h-3.5" />
        )}
        <span>{isCore ? 'Hạ xuống Member' : 'Nâng lên Core Member'}</span>
      </button>

      <Tooltip
        content={
          isCore
            ? 'Thành viên này hiện đang có quyền nộp bài và quản lý sản phẩm đại diện nhóm.'
            : 'Nâng cấp sẽ cho phép thành viên này tạo bài mới và gửi lên Thầy duyệt.'
        }
      />
    </div>
  );
}
