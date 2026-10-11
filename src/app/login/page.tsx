import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Shield, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function LoginFormFallback() {
  return (
    <div className="max-w-md mx-auto w-full animate-pulse bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-56 rounded" />
        </div>
      </div>
      <div className="space-y-3 pt-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl mt-4" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Đăng nhập - NexusShowcase | HCMUS',
  description: 'Cổng xác thực nghiên cứu khoa học và sản phẩm công nghệ sinh viên Khoa CNTT - ĐH Khoa học Tự nhiên ĐHQG-HCM',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Universal Navbar */}
      <Navbar />

      {/* Hero Header matching Swiss Modernism 2.0 & Academic HCMUS Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/50 to-slate-50 pt-10 pb-8 sm:pt-14 sm:pb-10 border-b border-slate-200/80">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold mb-4 shadow-2xs border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>KHOA CÔNG NGHỆ THÔNG TIN • ĐH KHOA HỌC TỰ NHIÊN - ĐHQG-HCM</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Cổng Đăng Nhập &amp; Xác Thực Thành Viên
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hệ thống quản lý, xuất bản bài báo khoa học, sản phẩm công nghệ tiên phong và tổng hợp hồ sơ năng lực học thuật sinh viên CLB Nexus.
          </p>
        </div>
      </section>

      {/* Main Interactive Form Area */}
      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl flex-1">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Institutional Academic Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">NexusShowcase Academic Portal</span>
            <span>• © 2026 Khoa CNTT, HCMUS</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <Link
              href="/"
              className="hover:text-blue-600 transition-colors hover:underline"
            >
              Trang khám phá
            </Link>
            <span>•</span>
            <a
              href="https://www.fit.hcmus.edu.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors hover:underline inline-flex items-center gap-1"
            >
              <span>Khoa CNTT HCMUS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
