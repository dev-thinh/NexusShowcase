'use client';

import { createMemberAction } from '@/features/identity/server/member-actions';
import { Modal } from '@/shared/ui/modal';
import { CustomSelect } from '@/shared/ui/custom-select';
import { SuccessNotice } from '@/shared/dialogs/success-notice';
import { notifySuccess } from '@/shared/dialogs/success';
import { Copy, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { createMemberInputSchema } from '../model/member-input';
import { ValidatedForm, FieldError } from '@/shared/ui/validated-form';

const inputClass = 'min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#153D67]/30';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-800';

export function AdminCreateMemberModal() {
  const router = useRouter();
  const id = useId();
  const submitting = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'CORE_MEMBER'>('MEMBER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleOpen = () => {
    setError(null); setTemporaryPassword(null); setFullName(''); setEmail('');
    setStudentId(''); setRole('MEMBER'); setPassword(''); setShowPassword(false); setIsOpen(true);
  };
  const handleCopy = async () => {
    if (!temporaryPassword || copying) return;
    setCopying(true); setError(null);
    try { await navigator.clipboard.writeText(temporaryPassword); await notifySuccess('Đã sao chép mật khẩu tạm thời.'); }
    catch { setError('Không sao chép được mật khẩu. Vui lòng thử lại.'); }
    finally { setCopying(false); }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setLoading(true); setError(null);
    try {
      const result = await createMemberAction({ fullName: fullName.trim(), email: email.trim(), studentId: studentId.trim() || undefined, role, password: password.trim() || undefined });
      if (!result.success) { setError(result.error || 'Không tạo được tài khoản. Vui lòng thử lại.'); return; }
      setTemporaryPassword(result.data.temporaryPassword);
      router.refresh();
    } catch { setError('Không kết nối được. Vui lòng thử lại.'); }
    finally { submitting.current = false; setLoading(false); }
  };

  return <>
    <button type="button" onClick={handleOpen} className="action-primary-detail"><UserPlus className="h-4 w-4" aria-hidden="true" />Thêm thành viên</button>
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} closeDisabled={loading || copying} title={temporaryPassword ? 'Thành công' : 'Thêm thành viên'} description={temporaryPassword ? undefined : 'Tạo tài khoản và chọn quyền truy cập.'} className={temporaryPassword ? '!rounded-2xl' : '!max-w-2xl !rounded-2xl'}>
      {temporaryPassword ? <div className="space-y-4">
        <SuccessNotice message={`Đã tạo tài khoản ${email.trim()}. Hãy sao chép mật khẩu tạm thời để gửi cho thành viên.`} />
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="min-w-0 flex-1"><p className="mb-1 text-sm text-slate-500">Mật khẩu tạm thời</p><p className="break-all font-mono text-base font-semibold text-slate-900">{temporaryPassword}</p></div>
          <button type="button" disabled={copying} onClick={() => void handleCopy()} className="action-secondary-detail disabled:opacity-50">{copying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}Sao chép</button>
        </div>
        <p className="text-sm leading-6 text-slate-500">Thành viên cần đổi mật khẩu khi đăng nhập lần đầu.</p>
        <div className="modal-footer"><button type="button" disabled={copying} onClick={() => setIsOpen(false)} className="action-primary-detail">Đã hiểu</button></div>
      </div> : <ValidatedForm schema={createMemberInputSchema} values={{ fullName, email, studentId, role, password }} inlineErrors onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && <p id={`${id}-error`} role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p>}
        <fieldset disabled={loading} className="space-y-4 disabled:opacity-60">
          <div><label htmlFor={`${id}-name`} className={labelClass}>Họ và tên <span aria-hidden="true" className="text-rose-700">*</span></label><input id={`${id}-name`} name="fullName" autoComplete="name" required maxLength={200} value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Nguyễn Văn A" className={inputClass} /><FieldError name="fullName" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor={`${id}-email`} className={labelClass}>Tên đăng nhập / Email <span aria-hidden="true" className="text-rose-700">*</span></label><input id={`${id}-email`} name="email" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="22120001 hoặc email" className={inputClass} /><FieldError name="email" /></div>
            <div><label htmlFor={`${id}-student`} className={labelClass}>Mã số sinh viên <span className="font-normal text-slate-400">(tùy chọn)</span></label><input id={`${id}-student`} name="studentId" maxLength={64} value={studentId} onChange={event => setStudentId(event.target.value)} placeholder="22120001" className={inputClass} /><FieldError name="studentId" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor={`${id}-role`} className={labelClass}>Vai trò</label><CustomSelect id={`${id}-role`} name="role" value={role} disabled={loading} className="[&>button]:rounded-lg" describedBy={`${id}-role-hint`} options={[{ value: 'MEMBER', label: 'Thành viên' }, { value: 'CORE_MEMBER', label: 'Thành viên chủ chốt' }]} onChange={value => setRole(value as 'MEMBER' | 'CORE_MEMBER')} /><FieldError name="role" /><p id={`${id}-role-hint`} className="mt-1.5 text-sm leading-6 text-slate-500">{role === 'CORE_MEMBER' ? 'Được đăng công trình và gửi xét duyệt.' : 'Xem nội dung và theo dõi công trình.'}</p></div>
            <div><label htmlFor={`${id}-password`} className={labelClass}>Mật khẩu ban đầu <span className="font-normal text-slate-400">(tùy chọn)</span></label><div className="relative"><input id={`${id}-password`} name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={15} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={`${id}-password-hint`} placeholder="Để trống để tự tạo" className={`${inputClass} pr-11`} /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30">{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div><FieldError name="password" /><p id={`${id}-password-hint`} className="mt-1.5 text-sm leading-6 text-slate-500">Hệ thống tự tạo nếu bỏ trống. Mật khẩu tự nhập cần ít nhất 15 ký tự.</p></div>
          </div>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">Thành viên cần đổi mật khẩu khi đăng nhập lần đầu.</p>
          <div className="modal-footer !justify-end"><button type="button" onClick={() => setIsOpen(false)} className="action-secondary-detail">Hủy</button><button type="submit" className="action-primary-detail">{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}{loading ? 'Đang tạo…' : 'Tạo tài khoản'}</button></div>
        </fieldset>
      </ValidatedForm>}
    </Modal>
  </>;
}
