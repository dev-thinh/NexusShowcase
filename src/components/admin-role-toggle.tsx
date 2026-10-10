'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction } from '@/actions/admin-actions';
import { Role } from '@prisma/client';

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
    return <span className="text-xs font-bold text-amber-700">Thầy Chủ Nhiệm</span>;
  }

  return (
    <button
      disabled={loading}
      onClick={toggleCoreMember}
      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
        currentRole === 'CORE_MEMBER'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {currentRole === 'CORE_MEMBER' ? 'Hạ xuống Member' : 'Nâng cấp lên Core Member'}
    </button>
  );
}
