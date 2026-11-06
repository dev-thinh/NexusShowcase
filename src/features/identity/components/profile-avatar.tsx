'use client';

import { useI18n } from '@/shared/i18n/provider';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { AvatarCropModal } from './avatar-crop-modal';
import { Camera, Eye, Loader2, Trash2 } from 'lucide-react';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { FilePicker } from '@/shared/ui/file-picker';
import { Modal } from '@/shared/ui/modal';
import { uploadFile } from '@/shared/lib/upload-file';
import { AVATAR_UPDATED_EVENT, type AvatarUpdate } from '@/shared/lib/avatar-update';
import { notifySuccess } from '@/shared/dialogs/success';

type Failure = { success: false; error: string };
type Props = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  removeAction?: () => Promise<{ success: true } | Failure>;
};

export function ProfileAvatar({ userId, fullName, avatarUrl, removeAction }: Props) {
  const { t: tr } = useI18n();

  const [src, setSrc] = useState(avatarUrl);
  const [menu, setMenu] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const own = !!removeAction;
  useEffect(() => setSrc(avatarUrl), [avatarUrl]);
  useEffect(() => {
    if (!menu) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setMenu(false); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); };
  }, [menu]);

  return <div ref={root} aria-busy={pending} className="relative shrink-0">
    <button ref={trigger} type="button" disabled={pending} onClick={() => { setError(''); own ? setMenu(!menu) : setViewing(true); }} aria-label={own ? tr("Tùy chọn ảnh đại diện") : tr("Xem ảnh đại diện của {0}", fullName)} aria-expanded={own ? menu : undefined} aria-controls={own ? `${id}-options` : undefined} className="group relative h-20 w-20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-4 disabled:cursor-wait sm:h-24 sm:w-24">
      <MemberAvatar fullName={fullName} src={src} alt={tr("Ảnh của {0}", fullName)} width={96} height={96} className="h-full w-full rounded-full border border-slate-200 object-cover text-3xl" />
      <span aria-hidden="true" className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-xs font-semibold text-white transition-opacity ${pending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>{pending ? <Loader2 className="h-6 w-6 animate-spin" /> : own ? tr("Tùy chọn ảnh") : <Eye className="h-6 w-6" />}</span>
      {own && <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-700 shadow-sm"><Camera className="h-4 w-4" /></span>}
    </button>
    {pending && <span role="status" className="sr-only">{tr("Đang cập nhật ảnh đại diện…")}</span>}
    {own && menu && <div id={`${id}-options`} role="group" aria-label={tr("Tùy chọn ảnh đại diện")} className="absolute left-0 top-full z-30 mt-3 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg" onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.current) setMenu(false); }}>
      <button type="button" onClick={() => { setMenu(false); setViewing(true); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30"><Eye className="h-4 w-4" aria-hidden="true" />{tr("Xem ảnh đại diện")}</button>
      <FilePicker label={tr("Thay đổi ảnh")} aria-label={tr("Chọn ảnh đại diện mới")} accept="image/jpeg,image/png,image/webp" showFileName={false} buttonClassName="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30" onChange={event => {
        const file = event.target.files?.[0];
        if (!file || !own) return;
        setMenu(false); setError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) { setError('Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.'); return; }
        setCropFile(file);
        event.target.value = '';

      }} />
    </div>}
    {error && !viewing && <p role="alert" className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800">{tr(error)}</p>}
    {cropFile && <AvatarCropModal file={cropFile} onCancel={() => { setCropFile(null); requestAnimationFrame(() => trigger.current?.focus()); }} onSave={async file => {
      const data = new FormData(); data.set('file', file);
      const result = await uploadFile<{ url: string }>(data, '/api/upload?target=avatar');
      if (!result.success) throw new Error(result.error);
      setSrc(result.data.url); setCropFile(null);
      window.dispatchEvent(new CustomEvent<AvatarUpdate>(AVATAR_UPDATED_EVENT, { detail: { userId, url: result.data.url } }));
      void notifySuccess('Đã cập nhật ảnh đại diện.').then(() => trigger.current?.focus());
    }} />}
    <Modal isOpen={viewing} onClose={() => { setViewing(false); setError(''); }} closeDisabled={pending} title={tr("Ảnh đại diện")} className="!max-w-xl !rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <MemberAvatar fullName={fullName} src={src} alt={tr("Ảnh đại diện của {0}", fullName)} width={384} height={384} className="aspect-square max-h-[60dvh] w-full max-w-96 rounded-xl object-contain text-8xl" />
        {!src && <p className="text-sm text-slate-500">{tr("Chưa có ảnh đại diện.")}</p>}
        {error && <p role="alert" className="text-sm text-rose-800">{tr(error)}</p>}
        {own && src && <button type="button" disabled={pending} className="action-secondary-detail !text-rose-700 disabled:opacity-50" onClick={() => {
          if (!removeAction) return;
          setError('');
          startTransition(async () => {
            try {
              const result = await removeAction();
              if (!result.success) { setError(result.error); return; }
              setSrc(null); setViewing(false);
              window.dispatchEvent(new CustomEvent<AvatarUpdate>(AVATAR_UPDATED_EVENT, { detail: { userId, url: null } }));
              await notifySuccess('Đã xóa ảnh đại diện và khôi phục avatar chữ.');
            } catch { setError('Không xóa được ảnh. Vui lòng thử lại.'); }
          });
        }}>{pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}{tr("Xóa ảnh đại diện")}</button>}
      </div>
    </Modal>
  </div>;
}
