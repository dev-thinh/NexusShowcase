'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, Loader2 } from 'lucide-react';
import { togglePinShowcaseItemAction } from '@/actions/showcase-actions';

interface PinToggleButtonProps {
  adminId: string;
  itemId: string;
  initialIsPinned: boolean;
  status: string;
}

export function PinToggleButton({
  adminId,
  itemId,
  initialIsPinned,
  status,
}: PinToggleButtonProps) {
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (status !== 'PUBLISHED') {
    return null;
  }

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await togglePinShowcaseItemAction(adminId, itemId);
      if (res.success && res.isPinned !== undefined) {
        setIsPinned(res.isPinned);
        router.refresh();
      } else if (res.error) {
        alert(res.error);
      }
    } catch (e: any) {
      alert(e.message || 'Có lỗi xảy ra khi ghim công trình.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-11 px-4 sm:px-5 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer ${
        isPinned
          ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600'
          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300'
      }`}
      title={isPinned ? 'Bấm để gỡ ghim khỏi trang chủ' : 'Bấm để ghim lên thanh cuộn phim trang chủ'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <Pin className={`w-4 h-4 ${isPinned ? 'fill-white text-white' : 'text-slate-500'}`} />
      )}
      <span>{isPinned ? 'Đang ghim trang chủ' : 'Ghim trang chủ'}</span>
    </button>
  );
}
