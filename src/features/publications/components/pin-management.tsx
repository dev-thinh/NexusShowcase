'use client';

import { setShowcasePinAction } from '@/features/publications/server/actions';
import { Modal } from '@/shared/ui/modal';
import { Loader2, Pin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function usePinManagement(itemId: string, initialIsPinned: boolean) {
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replacementOptions, setReplacementOptions] = useState<Array<{ id: string; title: string }> | null>(null);
  const busyRef = useRef(false);
  const router = useRouter();
  useEffect(() => setIsPinned(initialIsPinned), [initialIsPinned]);

  const toggle = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError('');
    try {
      const result = await setShowcasePinAction({ itemId, enabled: !isPinned });
      if (!result.success && result.details?.requiresReplacement) {
        setReplacementOptions(result.details.pinnedItems);
      } else if (result.success) {
        setIsPinned(result.data.isPinned);
        router.refresh();
      } else setError(result.error || 'Không cập nhật được trạng thái ghim.');
    } catch {
      setError('Không lưu được thay đổi. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  const replace = async (replacedItemId: string) => {
    if (busyRef.current || !replacementOptions?.some(item => item.id === replacedItemId)) return;
    busyRef.current = true;
    setLoading(true);
    setError('');
    try {
      const result = await setShowcasePinAction({ itemId, enabled: true, replaceItemIds: [replacedItemId] });
      if (result.success) {
        setIsPinned(true);
        setReplacementOptions(null);
        router.refresh();
      } else setError(result.error || 'Không thay thế được công trình.');
    } catch {
      setError('Không lưu được thay đổi. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };
  const close = () => {
    if (busyRef.current) return;
    setReplacementOptions(null);
    setError('');
  };
  return { isPinned, loading, error, replacementOptions, toggle, replace, close };
}

export function PinReplacementDialog({ pin, itemTitle }: { pin: ReturnType<typeof usePinManagement>; itemTitle?: string }) {
  const [selected, setSelected] = useState('');
  useEffect(() => setSelected(''), [pin.replacementOptions]);
  if (!pin.replacementOptions) return null;
  return createPortal(
    <Modal isOpen onClose={pin.close} title="Thay thế công trình nổi bật" description="Đã đủ 3 vị trí ghim. Chọn một bài đang ghim để thay thế bằng bài mới.">
      <form onSubmit={event => { event.preventDefault(); void pin.replace(selected); }}>
        <div className="mb-5 rounded-lg border border-slate-200 bg-[#FFFFFF] p-3">
          <p className="text-xs font-semibold text-[#1F2937]">Bài sẽ được ghim</p>
          <p className="mt-1 break-words text-sm font-semibold text-[#1F2937]">{itemTitle || 'Công trình đang chọn'}</p>
        </div>
        <fieldset disabled={pin.loading}>
          <legend className="mb-3 text-sm font-semibold text-[#1F2937]">Chọn bài cần thay thế</legend>
          <div className="max-h-[35dvh] space-y-2 overflow-y-auto p-1">
            {pin.replacementOptions.map(item => (
              <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#153D67] ${selected === item.id ? 'border-slate-200 bg-[#FFFFFF]' : 'border-slate-200 hover:bg-[#FFFFFF]'}`}>
                <input type="radio" name="replacedItemId" value={item.id} checked={selected === item.id} onChange={() => setSelected(item.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#153D67]" />
                <span className="min-w-0 flex-1 break-words text-sm leading-5 text-[#1F2937]">{item.title}</span>
                <Pin aria-hidden="true" className="h-4 w-4 shrink-0 text-[#1F2937]" />
              </label>
            ))}
          </div>
        </fieldset>
        {pin.error && <p role="alert" className="mt-3 text-sm text-[#1F2937]">{pin.error}</p>}
        <div className="modal-footer">
          <button type="button" onClick={pin.close} disabled={pin.loading} className="action-secondary-detail min-h-11 disabled:opacity-50">Hủy</button>
          <button type="submit" disabled={!selected || pin.loading} className="action-primary-detail min-h-11 disabled:opacity-50">
            {pin.loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            {pin.loading ? 'Đang thay thế…' : 'Thay thế'}
          </button>
        </div>
      </form>
    </Modal>, document.body,
  );
}
