import { Suspense } from 'react';
import { LoginForm } from './login-form';

function LoginFormFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto animate-pulse space-y-6">
      <div className="h-5 w-48 bg-slate-200 rounded-lg"></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
          <div className="h-7 w-40 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-100 rounded-xl"></div>
          <div className="h-10 bg-slate-100 rounded-xl"></div>
          <div className="h-11 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Đăng nhập - NexusShowcase | HCMUS',
  description: 'Cổng xác thực nghiên cứu khoa học và sản phẩm công nghệ sinh viên Khoa CNTT - ĐH KHTN ĐHQG-HCM',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/30 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
