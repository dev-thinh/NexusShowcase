'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  LogIn,
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
      setError('Vui lòng nhập tài khoản hoặc email.');
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
        setError('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    });
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6">
        {/* Header với icon trần to bằng tiêu đề */}
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
          <LogIn className="w-6 h-6 text-[#0F294A] shrink-0" />
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
            Đăng nhập
          </h1>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="font-semibold">
              Đăng nhập thành công! Đang chuyển hướng...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Tài khoản hoặc Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email..."
                disabled={isPending}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white hover:border-slate-300 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 text-slate-900 transition-all font-medium disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white hover:border-slate-300 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 text-slate-900 transition-all font-medium disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#0F294A] hover:bg-[#1E3A5F] active:scale-[0.98] text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3.5 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Chưa có tài khoản? </span>
          <Link
            href="/contact"
            className="font-bold text-[#0F294A] hover:underline"
          >
            Liên hệ ban quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}
