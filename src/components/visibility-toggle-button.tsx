'use client';

import { useState, useTransition } from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { toggleItemVisibilityAction } from '@/actions/showcase-actions';

interface VisibilityToggleButtonProps {
  itemId: string;
  initialVisibility: 'PUBLIC' | 'PRIVATE';
}

export function VisibilityToggleButton({ itemId, initialVisibility }: VisibilityToggleButtonProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleItemVisibilityAction(itemId);
      if (res.success && res.visibility) {
        setVisibility(res.visibility);
      }
    });
  };

  const isPublic = visibility === 'PUBLIC';

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
        isPublic
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
      }`}
      title="Bấm để chuyển đổi giữa Công khai cho khách và Chỉ lưu hành nội bộ"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPublic ? (
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-amber-600" />
      )}
      <span>{isPublic ? '🌐 Công khai cho khách' : '🔒 Chỉ nội bộ CLB'}</span>
    </button>
  );
}
