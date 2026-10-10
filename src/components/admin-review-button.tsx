'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewShowcaseItemAction } from '@/actions/showcase-actions';

export function AdminReviewButton({ adminId, itemId }: { adminId: string; itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReview = async (action: 'PUBLISH' | 'REJECT') => {
    let reason: string | undefined;
    if (action === 'REJECT') {
      const input = prompt('Nhập nhận xét / lý do yêu cầu nhóm chỉnh sửa:');
      if (!input) return;
      reason = input;
    }

    setLoading(true);
    await reviewShowcaseItemAction(adminId, itemId, { action, reason });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => handleReview('PUBLISH')}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
      >
        Duyệt xuất bản
      </button>
      <button
        disabled={loading}
        onClick={() => handleReview('REJECT')}
        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
      >
        Yêu cầu sửa
      </button>
    </div>
  );
}
