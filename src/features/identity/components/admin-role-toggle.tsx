'use client';

import { useI18n } from '@/shared/i18n/provider';
import { updateUserRoleAction } from '@/features/identity/server/member-actions';
import { Tooltip } from '@/shared/ui/tooltip';
import { Role } from '@prisma/client';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
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
  const { t: tr } = useI18n();

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



  if (currentRole === 'ADMIN') return null;

  const isCore = currentRole === 'CORE_MEMBER';
  const description = tr(isCore ? 'Đang có quyền đăng bài.' : 'Chưa có quyền đăng bài.');

  return (
    <div className="admin-role-control flex min-w-0 flex-none items-center gap-2">
      {error && <p role="alert" className="text-xs text-rose-800">{tr(error)}</p>}
      <button
        disabled={loading}
        onClick={toggleCoreMember}
        title={description}
        aria-description={description}
        className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3 sm:min-h-9 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:opacity-50 ${
          isCore
            ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            : 'border border-slate-200 bg-white text-[#153D67] hover:bg-slate-50'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isCore ? (
          <ArrowDownCircle className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpCircle className="w-3.5 h-3.5" />
        )}
        <span>{isCore ? tr("Thu quyền đăng bài") : tr("Cấp quyền đăng bài")}</span>
      </button>

      <div className="hidden lg:block"><Tooltip content={description} /></div>
    </div>
  );
}
