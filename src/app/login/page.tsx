import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';

function LoginFormFallback() {
  return (
    <div className="max-w-lg mx-auto w-full animate-pulse bg-white rounded-lg p-6 sm:p-8 border border-slate-200 space-y-5 shadow-xs">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <Skeleton className="w-7 h-7 rounded" />
        <Skeleton className="h-7 w-32 rounded" />
      </div>
      <div className="space-y-4 pt-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg mt-3" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Đăng nhập - NexusShowcase',
  description: 'Đăng nhập hệ thống NexusShowcase - Khoa CNTT, ĐH Khoa học Tự nhiên ĐHQG-HCM',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50">
      {/* Universal Navbar */}
      <Navbar />

      {/* Main Form Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Restored Institutional Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
