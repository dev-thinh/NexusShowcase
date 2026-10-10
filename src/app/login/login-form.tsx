'use client';

import { useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from './actions';
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
} from 'lucide-react';

interface QuickAccount {
  name: string;
  role: 'ADMIN' | 'CORE_MEMBER' | 'MEMBER';
  roleLabel: string;
  roleBadgeColor: string;
  email: string;
  password: string;
  description: string;
  icon: typeof Shield;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    name: 'PGS.TS. Trần Minh Triết',
    role: 'ADMIN',
    roleLabel: 'Cố vấn / Chủ nhiệm CLB (ADMIN)',
    roleBadgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    email: 'tranminhtriet@fit.hcmus.edu.vn',
    password: 'admin123456',
    description: 'Toàn quyền duyệt 1-click & xuất bản bài báo/dự án, bổ nhiệm thành viên nòng cốt.',
    icon: GraduationCap,
  },
  {
    name: 'Nguyễn Hoàng Long',
    role: 'CORE_MEMBER',
    roleLabel: 'Thành viên nòng cốt (CORE_MEMBER)',
    roleBadgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    email: '21120001@student.hcmus.edu.vn',
    password: 'member123456',
    description: 'Đăng tải bài báo nghiên cứu, sản phẩm công nghệ & tag nhóm tác giả linh hoạt.',
    icon: Zap,
  },
  {
    name: 'Phạm Thu Thảo',
    role: 'MEMBER',
    roleLabel: 'Thành viên CLB (MEMBER)',
    roleBadgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    email: '23120150@student.hcmus.edu.vn',
    password: 'member123456',
    description: 'Được tự động liên kết hồ sơ năng lực Portfolio khi đồng đội tag làm tác giả.',
    icon: UserCheck,
  },
];

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelectAccount = (account: QuickAccount, autoSubmit = false) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedAccountEmail(account.email);
    setError(null);

    if (autoSubmit) {
      submitCredentials(account.email, account.password);
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
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    submitCredentials(email, password);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back button & Institutional header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Về trang chủ Khám phá</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cổng xác thực CLB Nexus • FIT HCMUS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quick 1-Click Test Accounts */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tài khoản kiểm thử nhanh (1-Click Demo)
                </h2>
                <p className="text-xs text-slate-500">
                  Chọn vai trò để đăng nhập ngay mà không cần gõ mật khẩu
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {QUICK_ACCOUNTS.map((acc) => {
                const isSelected = selectedAccountEmail === acc.email;
                const IconComponent = acc.icon;

                return (
                  <div
                    key={acc.email}
                    className={`relative p-3.5 rounded-xl border transition-all text-left group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            acc.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-700'
                              : acc.role === 'CORE_MEMBER'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {acc.name}
                            </h3>
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.roleBadgeColor}`}
                          >
                            {acc.roleLabel}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Instant Login Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(acc, true)}
                        disabled={isPending}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        title={`Đăng nhập ngay với vai trò ${acc.name}`}
                      >
                        Đăng nhập ngay
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {acc.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="truncate max-w-[200px]">{acc.email}</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(acc, false)}
                        className="text-blue-600 hover:underline font-sans font-medium text-[11px] cursor-pointer"
                      >
                        Điền form
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Mật khẩu mẫu: <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">admin123456</code> (Admin) hoặc <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">member123456</code> (Member).
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Credentials Form */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="text-center sm:text-left mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm mb-4">
                <Sparkles className="w-6 h-6 text-blue-100" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Đăng nhập Nexus
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Sử dụng email trường HCMUS hoặc tài khoản nghiên cứu viên đã cấp
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  Đăng nhập thành công! Hệ thống đang chuyển hướng tới bảng điều khiển...
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Mã hóa chuẩn bcrypt
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
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

            {/* Note & Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400 leading-relaxed">
              Dự án Nexus Showcase phục vụ hoạt động nghiên cứu khoa học sinh viên Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
