import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap } from 'lucide-react';

function LoginFormFallback() {
  return (
    <div className="max-w-md mx-auto w-full animate-pulse bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4 shadow-xs">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <Skeleton className="w-12 h-12 rounded-xl" />
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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Universal Navbar */}
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden py-10 sm:py-14 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold mb-4 shadow-2xs border border-slate-200">
            <GraduationCap className="w-4 h-4 text-slate-600" />
            <span>KHOA CÔNG NGHỆ THÔNG TIN • ĐH KHOA HỌC TỰ NHIÊN - ĐHQG-HCM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Cổng Đăng Nhập &amp; Xác Thực Thành Viên
          </h1>

          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Hệ thống quản lý, xuất bản bài báo và hồ sơ năng lực học thuật sinh viên CLB Nexus.
          </p>
        </div>
      </section>

      {/* Main Interactive Form Area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl flex-1">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
