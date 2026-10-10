'use client';

import { useState, useTransition, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from './actions';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  Zap,
  ArrowLeft,
  GraduationCap,
  Users,
  UserCheck,
  Check,
  Info,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface QuickAccount {
  name: string;
  role: 'ADMIN' | 'CORE_MEMBER' | 'MEMBER';
  roleLabel: string;
  badgeClass: string;
  avatarBg: string;
  avatarText: string;
  initials: string;
  email: string;
  password: string;
  title: string;
  capabilities: string[];
  icon: typeof Shield;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    name: 'PGS.TS. Trần Minh Triết',
    role: 'ADMIN',
    roleLabel: 'ADMIN • Cố Vấn Học Thuật',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300/80',
    avatarBg: 'bg-gradient-to-tr from-amber-600 to-yellow-500',
    avatarText: 'text-white',
    initials: 'TMT',
    email: 'tranminhtriet@fit.hcmus.edu.vn',
    password: 'admin123456',
    title: 'Phó Hiệu trưởng • Cố vấn Học thuật CLB',
    capabilities: [
      '1-click phê duyệt & xuất bản bài báo/dự án',
      'Bổ nhiệm và điều chỉnh quyền thành viên nòng cốt',
      'Toàn quyền quản lý kho lưu trữ khoa học',
    ],
    icon: GraduationCap,
  },
  {
    name: 'Nguyễn Hoàng Long',
    role: 'CORE_MEMBER',
    roleLabel: 'CORE MEMBER • Thành Viên Nòng Cốt',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300/80',
    avatarBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600',
    avatarText: 'text-white',
    initials: 'NHL',
    email: '21120001@student.hcmus.edu.vn',
    password: 'member123456',
    title: 'SV K21 CNTN • Trưởng ban Học thuật CLB',
    capabilities: [
      'Đăng tải bài báo nghiên cứu, sản phẩm công nghệ',
      'Tag nhóm tác giả linh hoạt (thành viên + người ngoài)',
      'Cập nhật tài liệu, mã nguồn & video thuyết trình',
    ],
    icon: Zap,
  },
  {
    name: 'Phạm Thu Thảo',
    role: 'MEMBER',
    roleLabel: 'MEMBER • Thành Viên Thông Thường',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
    avatarText: 'text-white',
    initials: 'PTT',
    email: '23120150@student.hcmus.edu.vn',
    password: 'member123456',
    title: 'SV K23 Khoa CNTT • Thành viên CLB',
    capabilities: [
      'Tự động tích lũy Portfolio cá nhân khi được gắn thẻ',
      'Trang hồ sơ năng lực học thuật công khai có thể chia sẻ',
      'Được đồng đội tag vào các nhóm nghiên cứu tự do',
    ],
    icon: UserCheck,
  },
];

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAccount = (account: QuickAccount, autoSubmit = false) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedEmail(account.email);
    setError(null);

    if (autoSubmit) {
      submitCredentials(account.email, account.password);
    } else {
      // Focus into password field for convenience
      emailInputRef.current?.focus();
    }
  };

  const submitCredentials = (loginEmail: string, loginPass: string) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('email', loginEmail);
      formData.set('password', loginPass);
      formData.set('redirectTo', callbackUrl);

      try {
        const res = await loginAction(null, formData);
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
        }
      } catch (err: any) {
        // Next.js redirect throws a digest error that indicates success
        if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
          setSuccess(true);
        } else {
          setError('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại.');
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    submitCredentials(email.trim(), password);
  };

  return (
    <div className="w-full">
      {/* Breadcrumb & Institutional Context */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600 transition-colors group p-1 -ml-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Về trang chủ Khám phá</span>
        </Link>
        <div className="flex items-center gap-2 font-medium text-slate-500 bg-white/80 backdrop-blur-xs border border-slate-200/90 px-3 py-1.5 rounded-full shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL Docker Connected • Cổng xác thực CLB Nexus</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 1-Click Fast Login for Evaluation & Testing */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
            {/* Section Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Đăng nhập nhanh 1-chạm</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      Dành cho Demo / Test
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chọn nhanh vai trò để trải nghiệm tính năng phân quyền mà không cần gõ mật khẩu
                  </p>
                </div>
              </div>

              <Tooltip content="Hệ thống đã nạp sẵn tài khoản thực tế của giảng viên và sinh viên HCMUS vào PostgreSQL Docker. Bạn có thể nhấn 'Đăng nhập ngay' để vào thẳng vai trò mong muốn.">
                <div className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </Tooltip>
            </div>

            {/* Quick Accounts List */}
            <div className="mt-4 space-y-3.5">
              {QUICK_ACCOUNTS.map((acc) => {
                const isSelected = selectedEmail === acc.email;
                const IconComponent = acc.icon;

                return (
                  <div
                    key={acc.email}
                    className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Header with Avatar & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ${acc.avatarBg} ${acc.avatarText}`}
                        >
                          {acc.initials}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {acc.name}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.badgeClass}`}
                            >
                              {acc.roleLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {acc.title}
                          </p>
                        </div>
                      </div>

                      {/* 1-Click Instant Login Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(acc, true)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        title={`Đăng nhập ngay vai trò ${acc.name}`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Đăng nhập ngay</span>
                      </button>
                    </div>

                    {/* Capabilities list */}
                    <div className="mt-3 pl-1 space-y-1">
                      {acc.capabilities.map((cap, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-slate-600 leading-tight"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer credentials row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="truncate max-w-[240px] text-slate-500">
                        {acc.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(acc, false)}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-sans font-semibold text-xs cursor-pointer"
                      >
                        Điền vào form →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Mật khẩu seed: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono text-slate-800 text-[11px]">admin123456</code> (Admin) hoặc <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono text-slate-800 text-[11px]">member123456</code> (Member).
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Form with Full UI/UX Pro Max States */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm sticky top-24">
            {/* Header */}
            <div className="mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm mb-3">
                <Sparkles className="w-5 h-5 text-blue-100" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Đăng nhập Cổng Nexus
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sử dụng email sinh viên hoặc giảng viên HCMUS để truy cập bảng điều khiển
              </p>
            </div>

            {/* Error Banner with Guidance */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <div className="font-bold">Đăng nhập thất bại</div>
                  <div className="text-rose-700 mt-0.5">{error}</div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <div className="font-bold">Xác thực thành công!</div>
                  <div className="text-emerald-700 mt-0.5">
                    Đang chuyển hướng tới trang quản lý...
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    ref={emailInputRef}
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="21120001@student.hcmus.edu.vn"
                    disabled={isPending}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Bảo mật chuẩn bcrypt
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    disabled={isPending}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button with Loading & Blocking State */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực bảo mật...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng nhập vào hệ thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* University Institutional Notice */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <div className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Tài khoản sinh viên và giảng viên được đồng bộ từ cơ sở dữ liệu CLB Khoa CNTT - ĐH Khoa học Tự nhiên ĐHQG-HCM.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
