'use client';

import { loginAction } from '@/features/identity/server/login-actions';
import {
AlertCircle,
ArrowRight,
CheckCircle2,
Eye,
EyeOff,
Loader2,
Lock,
LogIn,
User,
} from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

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
    <div className="max-w-lg w-full mx-auto">
      <div className="panel-detail">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <LogIn aria-hidden="true" className="w-7 h-7 text-[#1F2937] shrink-0" />
          <h1 className="text-2xl font-semibold text-[#1F2937] leading-tight">Đăng nhập</h1>
        </div>

        {searchParams.get('passwordChanged') === '1' && (
          <p role="status" className="mt-4 rounded-lg border border-slate-200 bg-[#FFFFFF] p-3 text-sm text-[#1F2937]">
            Đã đổi mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.
          </p>
        )}

        {error && (
          <div
            id="login-error"
            role="alert"
            className="mt-4 p-3.5 rounded-lg bg-[#FFFFFF] border border-slate-200 text-[#1F2937] text-sm flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-[#1F2937] shrink-0" />
            <div className="font-semibold">{error}</div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-4 p-3.5 rounded-lg bg-[#FFFFFF] border border-slate-200 text-[#1F2937] text-sm flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-[#1F2937] shrink-0" />
            <div className="font-semibold">
              Đăng nhập thành công! Đang chuyển hướng...
            </div>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs sm:text-sm font-semibold text-[#1F2937] uppercase tracking-wider mb-2"
            >
              Tài khoản hoặc Email
            </label>
            <div className="relative">
              <User aria-hidden="true" className="w-4 h-4 text-[#1F2937] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-describedby={error ? 'login-error' : undefined}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email..."
                disabled={isPending}
                className="w-full pl-10 pr-4 py-3 text-sm sm:text-base bg-white hover:border-slate-200 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153D67]/15 focus:border-slate-200 text-[#1F2937] transition-all font-semibold disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-semibold text-[#1F2937] uppercase tracking-wider mb-2"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock aria-hidden="true" className="w-4 h-4 text-[#1F2937] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                aria-describedby={error ? 'login-error' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full pl-10 pr-10 py-3 text-sm sm:text-base bg-white hover:border-slate-200 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153D67]/15 focus:border-slate-200 text-[#1F2937] transition-all font-semibold disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1F2937] hover:text-[#1F2937] p-1 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-3 py-3 px-5 rounded-lg bg-brand-button hover:brightness-110 active:scale-[0.98] text-white font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]"
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

        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs sm:text-sm text-[#1F2937]">
          <span>Chưa có tài khoản? </span>
          <Link
            href="/contact"
            className="font-semibold text-[#1F2937] hover:underline"
          >
            Liên hệ ban quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}
