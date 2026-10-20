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
      className={`action-toggle-detail cursor-pointer ${
        isPublic
          ? 'text-emerald-800 border-emerald-300 hover:border-emerald-500'
          : 'text-amber-800 border-amber-300 hover:border-amber-500'
      }`}
      title="Bấm để chuyển đổi giữa Công khai cho khách và Chỉ lưu hành nội bộ"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPublic ? (
        <Globe className="w-4 h-4 text-emerald-600" />
      ) : (
        <Lock className="w-4 h-4 text-amber-600" />
      )}
      <span>{isPublic ? 'Công khai cho khách' : 'Chỉ nội bộ CLB'}</span>
    </button>
  );
}
