'use client';

import { useId, useState, useTransition } from 'react';
import { Modal } from '@/shared/ui/modal';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { profileFormSchema, type ProfileInput } from '../model/profile-input';
import { ValidatedForm, FieldError } from '@/shared/ui/validated-form';
import { updateProfileAction } from '../server/profile-actions';
import { notifySuccess } from '@/shared/dialogs/success';

export function ProfileEditor({ profile }: { profile: ProfileInput }) {
  const [links, setLinks] = useState(profile.links);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const id = useId();
  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]/30';
  const open = () => { setLinks(profile.links); setEditing(true); setError(''); };

  return <>
    <button type="button" className="action-primary-detail" onClick={open}><Pencil className="h-4 w-4" aria-hidden="true" />Chỉnh sửa hồ sơ</button>
    <Modal isOpen={editing} onClose={() => { setEditing(false); setError(''); }} closeDisabled={pending} title="Chỉnh sửa hồ sơ" className="!max-w-2xl !rounded-2xl">
    <ValidatedForm schema={profileFormSchema} values={{ links }} inlineErrors onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const input: ProfileInput = { fullName: String(data.get('fullName') ?? ''), bio: String(data.get('bio') ?? ''), links: links.filter(link => link.title.trim() || link.url.trim()) };
      setError('');
      startTransition(async () => {
        try {
          const result = await updateProfileAction(input);
          if (!result.success) { setError(result.error); return; }
          setEditing(false);
          router.refresh();
          await notifySuccess('Đã cập nhật hồ sơ của bạn.');
        } catch { setError('Không lưu được hồ sơ. Vui lòng thử lại.'); }
      });
    }} className="space-y-4 text-left">
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
        <div>
          <label htmlFor={`${id}-fullName`} className="mb-1.5 block text-sm font-semibold">Họ và tên</label>
          <input id={`${id}-fullName`} name="fullName" autoComplete="name" maxLength={200} required defaultValue={profile.fullName} className={inputClass} /><FieldError name="fullName" />
        </div>
        <div><label htmlFor={`${id}-bio`} className="mb-1.5 block text-sm font-semibold">Giới thiệu</label><textarea id={`${id}-bio`} name="bio" rows={3} maxLength={2000} defaultValue={profile.bio} className={inputClass} placeholder="Một vài dòng về bạn và lĩnh vực bạn quan tâm" /><FieldError name="bio" /></div>
        <section aria-label="Liên kết cá nhân" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Liên kết cá nhân</h3><button type="button" disabled={links.length >= 12} className="action-secondary-detail" onClick={() => setLinks([...links, { title: '', url: '' }])}><Plus className="h-4 w-4" aria-hidden="true" />Thêm liên kết</button></div>
          <FieldError name="links" />
          {links.map((link, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
            <div><label htmlFor={`${id}-title-${index}`} className="mb-1 block text-sm text-slate-600">Tên hiển thị</label><input id={`${id}-title-${index}`} name={`links.${index}.title`} value={link.title} maxLength={80} required={!!link.url.trim()} placeholder="Website, Facebook…" onChange={event => setLinks(links.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))} className={inputClass} /><FieldError name={`links.${index}.title`} /></div>
            <div className="col-start-1 sm:col-start-auto"><label htmlFor={`${id}-url-${index}`} className="mb-1 block text-sm text-slate-600">URL</label><input id={`${id}-url-${index}`} name={`links.${index}.url`} type="url" value={link.url} maxLength={2048} required={!!link.title.trim()} placeholder="https://" onChange={event => setLinks(links.map((entry, i) => i === index ? { ...entry, url: event.target.value } : entry))} className={inputClass} /><FieldError name={`links.${index}.url`} /></div>
            <button type="button" aria-label={`Xóa liên kết ${index + 1}`} onClick={() => setLinks(links.filter((_, i) => i !== index))} className="col-start-2 row-start-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-[#153D67] sm:col-start-auto sm:row-start-auto"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </div>)}
        </section>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" className="action-secondary-detail" onClick={() => { setEditing(false); setError(''); }}>Hủy</button>
          <button type="submit" className="action-primary-detail">{pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{pending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </fieldset>
    </ValidatedForm>
    </Modal>
  </>;
}
