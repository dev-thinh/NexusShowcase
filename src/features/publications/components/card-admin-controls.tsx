'use client';

import { PinReplacementDialog, usePinManagement } from '@/features/publications/components/pin-management';
import { setShowcaseVisibilityAction } from '@/features/publications/server/actions';
import { Loader2, Pin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { notifySuccess } from '@/shared/dialogs/success';

interface CardAdminControlsProps {
  itemId: string;
  itemTitle: string;
  initialIsPinned: boolean;
  initialVisibility: 'PUBLIC' | 'PRIVATE';
  variant?: 'card' | 'detail';
  showPin?: boolean;
}

export function CardAdminControls({ itemId, itemTitle, initialIsPinned, initialVisibility, variant = 'card', showPin = true }: CardAdminControlsProps) {
  const pin = usePinManagement(itemId, initialIsPinned);
  const isPinned = pin.isPinned;
  const [visibility, setVisibility] = useState(initialVisibility);
  const [pending, setPending] = useState<'visibility' | 'pin' | null>(null);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const router = useRouter();

  useEffect(() => setVisibility(initialVisibility), [initialVisibility]);

  const toggle = async (kind: 'visibility' | 'pin') => {
    if (busyRef.current || pin.loading) return;
    if (kind === 'pin') { setError(''); await pin.toggle(); return; }
    busyRef.current = true;
    setPending(kind);
    setError('');
    try {
      if (kind === 'visibility') {
        const result = await setShowcaseVisibilityAction({ itemId, visibility: visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' });
        if (!result.success) { setError(result.error); return; }
        setVisibility(result.data.visibility);
        await notifySuccess(result.data.visibility === 'PUBLIC' ? 'Đã chuyển công trình sang công khai.' : 'Đã chuyển công trình sang phạm vi nội bộ.');
      }
      router.refresh();
    } catch {
      setError('Không lưu được thay đổi. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setPending(null);
    }
  };

  return (
    <div role="group" aria-label={`Quản lý công trình: ${itemTitle}`} className={variant === 'detail' ? 'grid w-full gap-2' : `ml-auto grid w-fit shrink-0 items-center gap-x-2 border-l border-slate-200 pl-3 ${showPin ? 'grid-cols-[auto_2.75rem]' : 'grid-cols-1'}`}>
      {([
        { kind: 'visibility', label: 'Công khai', checked: visibility === 'PUBLIC', description: 'Bật: khách có thể xem bài. Tắt: chỉ lưu hành nội bộ.' },
        { kind: 'pin', label: 'Ghim trang chủ', checked: isPinned, description: 'Ưu tiên hiển thị bài trong mục Công trình nổi bật.' },
      ] as const).filter(({ kind }) => showPin || kind !== 'pin').map(({ kind, label, checked, description }) => (
        <button key={kind} type="button" role={kind === 'visibility' ? 'switch' : undefined} aria-label={`${label}: ${itemTitle}`} aria-checked={kind === 'visibility' ? checked : undefined} aria-pressed={kind === 'pin' ? checked : undefined} aria-busy={kind === 'pin' ? pin.loading : pending === kind}
          title={kind === 'pin' ? checked ? 'Bỏ ghim khỏi trang chủ' : 'Ghim lên trang chủ' : description} disabled={pending !== null || pin.loading} onClick={event => { event.stopPropagation(); void toggle(kind); }}
          className={variant === 'detail' ? 'action-toggle-detail !w-full border-slate-200 text-[#1F2937] hover:border-slate-200 disabled:cursor-wait' : 'flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md py-0 text-[11px] font-semibold leading-4 text-[#1F2937] transition-colors hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60'}>
          {kind === 'pin' ? (
            <>
              {pin.loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-[#1F2937]" /> : <Pin aria-hidden="true" className={`h-5 w-5 transition-colors ${checked ? 'fill-[#153D67] text-[#1F2937]' : 'text-[#1F2937]'}`} />}
              {variant === 'detail' && <span>{checked ? 'Đang ghim trang chủ' : 'Ghim trang chủ'}</span>}
            </>
          ) : <>
          <span>{label}</span>
          <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${variant === 'detail' ? 'h-6 w-11' : 'h-5 w-8'} ${checked ? 'bg-brand-button' : 'bg-slate-300'}`}>
            <span className={`absolute left-0.5 flex items-center justify-center rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${variant === 'detail' ? 'h-5 w-5' : 'h-4 w-4'} ${checked ? variant === 'detail' ? 'translate-x-5' : 'translate-x-3' : ''}`}>
              {pending === kind && <Loader2 className="h-2.5 w-2.5 animate-spin text-[#1F2937]" />}
            </span>
          </span>
          </>}
        </button>
      ))}
      {(error || (pin.error && !pin.replacementOptions)) && <p role="alert" className="col-span-2 pb-2 text-xs leading-5 text-[#1F2937]">{error || pin.error}</p>}
      <PinReplacementDialog pin={pin} itemTitle={itemTitle} />
    </div>
  );
}
