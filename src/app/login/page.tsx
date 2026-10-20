import { Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail } from 'lucide-react';

function LoginFormFallback() {
  return <div className="panel-detail max-w-lg mx-auto w-full space-y-5" aria-busy="true" aria-label="Đang tải biểu mẫu đăng nhập">
    <h2 className="border-b border-slate-100 pb-4 text-2xl font-semibold text-slate-900">Đăng nhập</h2>
    {['Email', 'Mật khẩu'].map(label => <div key={label} className="space-y-2"><span className="block text-sm font-semibold text-slate-700">{label}</span><Skeleton className="h-12 w-full rounded-lg" /></div>)}
    <button disabled className="w-full rounded-lg bg-brand-button py-3 font-semibold text-white opacity-60">Đăng nhập</button>
  </div>;
}

export const metadata = {
  title: 'Đăng nhập - CLB Robotics & IoT',
  description: 'Cổng xác thực nghiên cứu khoa học và sản phẩm công nghệ - Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM',
};

export default async function LoginPage() {
  return <div className="min-h-screen flex flex-col bg-background relative overflow-hidden selection:bg-slate-900 selection:text-white">
    <Navbar />
    <div className="absolute top-16 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4" />
    <div className="absolute top-16 right-0 w-96 h-96 bg-purple-100/35 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
    <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-100/25 rounded-full blur-3xl pointer-events-none" />
    <main className="min-h-[calc(100dvh-4rem)] flex-1 flex items-center justify-center py-8 sm:py-10 lg:py-12 relative z-10">
      <div className="container w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          <aside className="lg:col-span-7 xl:col-span-7 space-y-6">
            <div data-brand-lockup="login" className="inline-flex items-center gap-2.5 sm:gap-3 px-3 py-2 rounded-lg bg-slate-100/80">
              <div className="flex items-center gap-2 shrink-0 text-[#0F294A] text-xs font-semibold tracking-wide"><span className="w-1.5 h-1.5 rounded-[2px] bg-[#0F294A]/70" /><span>CLB Robotics &amp; IoT</span></div>
              <div className="hidden sm:block h-3.5 w-px bg-slate-200" />
              <span className="text-[10px] sm:text-[13px] font-semibold text-slate-600 tracking-tight whitespace-nowrap">Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-semibold text-slate-900 tracking-tight leading-[1.12]">Ươm mầm nghiên cứu <br className="hidden sm:inline" />&amp; Sáng tạo công nghệ.</h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">Không gian nghiên cứu tại Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM. Nơi kết nối sinh viên đam mê công nghệ, lưu trữ các đề tài nghiên cứu khoa học, khóa luận xuất sắc và phát triển các giải pháp Robotics &amp; IoT tiên phong.</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-button hover:brightness-110 text-white text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"><ArrowLeft aria-hidden="true" className="w-4 h-4 text-white/80" /><span>Trang chủ</span></Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-300 shadow-2xs transition-all active:scale-[0.98]"><Mail className="w-4 h-4 text-slate-500" /><span>Liên hệ</span></Link>
            </div>
          </aside>
          <div className="lg:col-span-5 xl:col-span-5 w-full"><Suspense fallback={<LoginFormFallback />}><LoginForm /></Suspense></div>
        </div>
      </div>
    </main>
  </div>;
}
