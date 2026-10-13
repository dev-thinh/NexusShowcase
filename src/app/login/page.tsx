import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';

function LoginFormFallback() {
  return (
    <div className="max-w-md mx-auto w-full animate-pulse bg-white rounded-lg p-5 sm:p-6 border border-slate-200 space-y-4 shadow-xs">
      <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
        <Skeleton className="w-6 h-6 rounded mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-28 rounded" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>
      </div>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg mt-3" />
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
    <div className="h-screen max-h-screen flex flex-col justify-between font-sans bg-slate-50/50 overflow-hidden">
      {/* Universal Navbar */}
      <Navbar />

      {/* Main Single-Screen Form Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-3 sm:px-6 min-h-0">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>

      {/* 1-Line Neutral Institutional Footer */}
      <footer className="py-2.5 px-4 border-t border-slate-200/80 bg-white/80 text-center text-xs text-slate-500 shrink-0">
        <span>© {new Date().getFullYear()} NexusShowcase • Khoa Công nghệ Thông tin, Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM</span>
      </footer>
    </div>
  );
}
