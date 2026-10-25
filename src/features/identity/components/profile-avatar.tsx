'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Eye, Loader2, Trash2 } from 'lucide-react';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { FilePicker } from '@/shared/ui/file-picker';
import { Modal } from '@/shared/ui/modal';
import { notifySuccess } from '@/shared/dialogs/success';

type Failure = { success: false; error: string };
type Props = {
  fullName: string;
  avatarUrl: string | null;
  uploadAction?: (data: FormData) => Promise<{ success: true; data: { url: string } } | Failure>;
  removeAction?: () => Promise<{ success: true } | Failure>;
};

export function ProfileAvatar({ fullName, avatarUrl, uploadAction, removeAction }: Props) {
  const [src, setSrc] = useState(avatarUrl);
  const [menu, setMenu] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const router = useRouter();
  const own = !!uploadAction && !!removeAction;
  useEffect(() => setSrc(avatarUrl), [avatarUrl]);
  useEffect(() => {
    if (!menu) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setMenu(false); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); };
  }, [menu]);

  return <div ref={root} className="relative shrink-0">
    <button ref={trigger} type="button" disabled={pending} onClick={() => { setError(''); own ? setMenu(!menu) : setViewing(true); }} aria-label={own ? 'Tùy chọn ảnh đại diện' : `Xem ảnh đại diện của ${fullName}`} aria-expanded={own ? menu : undefined} aria-controls={own ? `${id}-options` : undefined} className="group relative h-20 w-20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-4 disabled:cursor-wait sm:h-24 sm:w-24">
      <MemberAvatar fullName={fullName} src={src} alt={`Ảnh của ${fullName}`} width={96} height={96} className="h-full w-full rounded-full border border-slate-200 object-cover text-3xl" />
      <span aria-hidden="true" className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-xs font-semibold text-white transition-opacity ${pending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>{pending ? <Loader2 className="h-6 w-6 animate-spin" /> : own ? 'Tùy chọn ảnh' : <Eye className="h-6 w-6" />}</span>
      {own && <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-700 shadow-sm"><Camera className="h-4 w-4" /></span>}
    </button>
    {own && menu && <div id={`${id}-options`} role="group" aria-label="Tùy chọn ảnh đại diện" className="absolute left-0 top-full z-30 mt-3 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg" onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.current) setMenu(false); }}>
      <button type="button" onClick={() => { setMenu(false); setViewing(true); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30"><Eye className="h-4 w-4" aria-hidden="true" />Xem ảnh đại diện</button>
      <FilePicker label="Thay đổi ảnh" aria-label="Chọn ảnh đại diện mới" accept="image/jpeg,image/png,image/webp" showFileName={false} buttonClassName="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30" onChange={event => {
        const file = event.target.files?.[0];
        if (!file || !uploadAction) return;
        setMenu(false); setError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) { setError('Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.'); return; }
        startTransition(async () => {
          try {
            const data = new FormData(); data.set('file', file);
            const result = await uploadAction(data);
            if (!result.success) { setError(result.error); return; }
            setSrc(result.data.url); router.refresh();
            await notifySuccess('Đã cập nhật ảnh đại diện.');
          } catch { setError('Không đổi được ảnh. Vui lòng thử lại.'); }
        });
      }} />
    </div>}
    {error && !viewing && <p role="alert" className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800">{error}</p>}
    <Modal isOpen={viewing} onClose={() => { setViewing(false); setError(''); }} closeDisabled={pending} title="Ảnh đại diện" className="!max-w-xl !rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <MemberAvatar fullName={fullName} src={src} alt={`Ảnh đại diện của ${fullName}`} width={384} height={384} className="aspect-square max-h-[60dvh] w-full max-w-96 rounded-xl object-contain text-8xl" />
        {!src && <p className="text-sm text-slate-500">Chưa có ảnh đại diện.</p>}
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        {own && src && <button type="button" disabled={pending} className="action-secondary-detail !text-rose-700 disabled:opacity-50" onClick={() => {
          if (!removeAction) return;
          setError('');
          startTransition(async () => {
            try {
              const result = await removeAction();
              if (!result.success) { setError(result.error); return; }
              setSrc(null); setViewing(false); router.refresh();
              await notifySuccess('Đã xóa ảnh đại diện và khôi phục avatar chữ.');
            } catch { setError('Không xóa được ảnh. Vui lòng thử lại.'); }
          });
        }}>{pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}Xóa ảnh đại diện</button>}
      </div>
    </Modal>
  </div>;
}
