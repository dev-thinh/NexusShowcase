'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from './actions';
import {
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('email', identifier.trim());
      formData.set('password', password);
      formData.set('redirectTo', callbackUrl);

      try {
        const res = await loginAction(null, formData);
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
        }
      } catch (err: any) {
        if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
          setSuccess(true);
          return;
        }
        setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      }
    });
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-[#0F294A] text-white flex items-center justify-center shadow-xs">
            <Lock className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-serif">
              Xác Thực Thành Viên
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Cổng quản trị &amp; công bố nghiên cứu
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="font-semibold">
              Xác thực thành công! Đang chuyển hướng...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
            >
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Tên đăng nhập hoặc email..."
                disabled={isPending}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white hover:border-slate-300 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 text-slate-900 transition-all font-medium disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white hover:border-slate-300 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 text-slate-900 transition-all font-medium disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] active:scale-[0.98] text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-slate-500 text-xs leading-relaxed">
          <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            Hệ thống nội bộ phục vụ nghiên cứu khoa học. Vui lòng liên hệ Quản trị viên nếu bạn chưa được cấp tài khoản.
          </div>
        </div>
      </div>
    </div>
  );
}
