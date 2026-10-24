'use client';

import { PinReplacementDialog, usePinManagement } from '@/features/publications/components/pin-management';
import { Loader2, Pin } from 'lucide-react';

interface PinToggleButtonProps {
  itemId: string;
  initialIsPinned: boolean;
  status: string;
  compact?: boolean;
  variant?: 'button' | 'switch';
  itemTitle?: string;
}

export function PinToggleButton({
  itemId,
  initialIsPinned,
  status,
  compact = false,
  variant = 'button',
  itemTitle,
}: PinToggleButtonProps) {
  const pin = usePinManagement(itemId, initialIsPinned);
  const { isPinned, loading } = pin;
  const error = pin.replacementOptions ? '' : pin.error;
  const handleToggle = pin.toggle;
  if (status !== 'PUBLISHED') return null;

  if (variant === 'switch') {
    return (
      <div className="min-w-0">
        <button type="button" role="switch" aria-checked={isPinned} aria-busy={loading}
          aria-label={`Ghim trang chủ${itemTitle ? `: ${itemTitle}` : ''}`}
          onClick={event => { event.stopPropagation(); void handleToggle(); }} disabled={loading}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-1 text-xs font-semibold text-[#1F2937] transition-colors hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
          <span>Ghim trang chủ</span>
          <span aria-hidden="true" className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${isPinned ? 'bg-brand-button' : 'bg-slate-300'}`}>
            <span className={`absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${isPinned ? 'translate-x-5' : ''}`}>
              {loading && <Loader2 className="h-3 w-3 animate-spin text-[#1F2937]" />}
            </span>
          </span>
        </button>
        <PinReplacementDialog pin={pin} itemTitle={itemTitle} />
        {error && <p role="alert" className="max-w-xs text-xs text-[#1F2937]">{error}</p>}
      </div>
    );
  }

  return (
    <div>
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`${compact ? 'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border bg-transparent px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:opacity-50' : 'action-toggle-detail'} ${
        isPinned
          ? 'text-[#1F2937] border-slate-200 hover:border-slate-200'
          : 'text-[#1F2937] hover:text-[#1F2937] border-slate-200 hover:border-slate-200'
      }`}
      title={isPinned ? 'Bấm để gỡ ghim khỏi trang chủ' : 'Bấm để ghim lên trang chủ'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <Pin className={`w-4 h-4 ${isPinned ? 'fill-[#153D67] text-[#1F2937]' : 'text-[#1F2937]'}`} />
      )}
      <span>{isPinned ? compact ? 'Gỡ ghim' : 'Đang ghim trang chủ' : 'Ghim trang chủ'}</span>
    </button>
    <PinReplacementDialog pin={pin} itemTitle={itemTitle} />
    {error && <p role="alert" className="mt-1 text-xs text-[#1F2937]">{error}</p>}
    </div>
  );
}
