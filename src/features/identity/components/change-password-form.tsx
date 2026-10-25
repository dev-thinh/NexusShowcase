'use client';

import { changePasswordAction } from '@/features/identity/server/account-actions';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { notifySuccess } from '@/shared/dialogs/success';
import { signOut } from 'next-auth/react';
import { useEffect, useId, useState, useTransition } from 'react';
import { changePasswordFormSchema } from '../model/password-input';
import { ValidatedForm, FieldError } from '@/shared/ui/validated-form';

export function ChangePasswordForm({ embedded = false, onBusyChange }: { embedded?: boolean; onBusyChange?: (busy: boolean) => void } = {}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const id = useId();
  useEffect(() => { onBusyChange?.(isPending || success); }, [isPending, success, onBusyChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
      const res = await changePasswordAction({ currentPassword, newPassword });
      if (!res.success) {
        setError(res.error || 'Đổi mật khẩu thất bại.');
      } else {
        setSuccess(true);
        await notifySuccess('Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.');
        await signOut({ callbackUrl: '/login' });
      }
      } catch { setSuccess(false); setError('Không đổi được mật khẩu. Vui lòng thử lại.'); }
    });
  };

  return (
    <div className="max-w-md mx-auto w-full text-left">
      <div className={embedded ? '' : 'panel-detail sm:p-7'}>
        {!embedded && <div className="pb-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-[#1F2937] tracking-tight leading-tight">
              Đổi Mật Khẩu
            </h2>
            <p className="text-xs sm:text-sm text-[#1F2937] truncate max-w-sm mt-0.5">
              Cập nhật mật khẩu bảo mật cho tài khoản của bạn
            </p>
          </div>
        </div>}

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-md bg-[#FFFFFF] border border-slate-200 text-[#1F2937] text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-[#1F2937] shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">{error}</div>
          </div>
        )}

        <ValidatedForm schema={changePasswordFormSchema} values={{ currentPassword, newPassword, confirmPassword }} inlineErrors onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label htmlFor={`${id}-current`} className="block text-sm font-semibold text-[#1F2937] mb-1.5">
              Mật khẩu hiện tại / Mật khẩu tạm thời
            </label>
            <input
              id={`${id}-current`}
              name="currentPassword"
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[#1F2937] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#153D67]/20 focus:border-slate-200"
              placeholder="••••••••"
              disabled={isPending || success}
            /><FieldError name="currentPassword" />
          </div>

          <div>
            <label htmlFor={`${id}-new`} className="block text-sm font-semibold text-[#1F2937] mb-1.5">
              Mật khẩu mới (tối thiểu 15 ký tự)
            </label>
            <input
              id={`${id}-new`}
              name="newPassword"
              required
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[#1F2937] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#153D67]/20 focus:border-slate-200"
              placeholder="••••••••"
              disabled={isPending || success}
            /><FieldError name="newPassword" />
          </div>

          <div>
            <label htmlFor={`${id}-confirm`} className="block text-sm font-semibold text-[#1F2937] mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input
              id={`${id}-confirm`}
              name="confirmPassword"
              required
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[#1F2937] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#153D67]/20 focus:border-slate-200"
              placeholder="••••••••"
              disabled={isPending || success}
            /><FieldError name="confirmPassword" />
          </div>

          <button
            type="submit"
            disabled={isPending || success}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-button hover:brightness-110 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Xác nhận đổi mật khẩu</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </ValidatedForm>
      </div>
    </div>
  );
}
