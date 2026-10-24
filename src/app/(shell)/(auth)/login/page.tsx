import { LoginForm } from '@/features/identity/components/login-form';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, Mail } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { Suspense } from 'react';

function LoginFormFallback() {
  return <div className="panel-detail max-w-lg mx-auto w-full space-y-5" aria-busy="true" aria-label="Đang tải biểu mẫu đăng nhập">
    <h2 className="border-b border-slate-200 pb-4 text-2xl font-semibold text-[#1F2937]">Đăng nhập</h2>
    {['Email', 'Mật khẩu'].map(label => <div key={label} className="space-y-2"><span className="block text-sm font-semibold text-[#1F2937]">{label}</span><Skeleton className="h-12 w-full rounded-lg" /></div>)}
    <button disabled className="w-full rounded-lg bg-brand-button py-3 font-semibold text-white opacity-60">Đăng nhập</button>
  </div>;
}

export const metadata = {
  title: 'Đăng nhập - CLB Robotics & IoT',
  description: 'Cổng xác thực nghiên cứu khoa học và sản phẩm công nghệ - Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM',
};

export default async function LoginPage() {
  return <div className="flex flex-1 flex-col bg-background relative overflow-hidden selection:bg-[#153D67] selection:text-white">

    <div className="absolute top-16 left-0 w-96 h-96 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4" />
    <div className="absolute top-16 right-0 w-96 h-96 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
    <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none" />
    <main className="min-h-[calc(100dvh-4rem)] flex-1 flex items-center justify-center py-8 sm:py-10 lg:py-12 relative z-10">
      <div className="container w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Đăng nhập' }]} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          <aside className="lg:col-span-7 xl:col-span-7 space-y-6">
            <div data-brand-lockup="login" className="inline-flex items-center gap-2.5 sm:gap-3 px-3 py-2 rounded-lg bg-[#FFFFFF]">
              <div className="flex items-center gap-2 shrink-0 text-[#1F2937] text-xs font-semibold tracking-wide"><span className="w-1.5 h-1.5 rounded-[2px] bg-[#153D67]/70" /><span>CLB Robotics &amp; IoT</span></div>
              <div className="hidden sm:block h-3.5 w-px bg-[#153D67]" />
              <span className="text-[10px] sm:text-[13px] font-semibold text-[#1F2937] tracking-tight whitespace-nowrap">Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-semibold text-[#1F2937] tracking-tight leading-[1.12]">Ươm mầm nghiên cứu <br className="hidden sm:inline" />&amp; Sáng tạo công nghệ.</h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#1F2937] leading-relaxed max-w-xl font-normal">Không gian nghiên cứu tại Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM. Nơi kết nối sinh viên đam mê công nghệ, lưu trữ các đề tài nghiên cứu khoa học, khóa luận xuất sắc và phát triển các giải pháp Robotics &amp; IoT tiên phong.</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-button hover:brightness-110 text-white text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"><ArrowLeft aria-hidden="true" className="w-4 h-4 text-white/80" /><span>Trang chủ</span></Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-[#FFFFFF] text-[#1F2937] text-sm font-semibold border border-slate-200 shadow-2xs transition-all active:scale-[0.98]"><Mail className="w-4 h-4 text-[#1F2937]" /><span>Liên hệ</span></Link>
            </div>
          </aside>
          <div className="lg:col-span-5 xl:col-span-5 w-full"><Suspense fallback={<LoginFormFallback />}><LoginForm /></Suspense></div>
        </div>
      </div>
    </main>
  </div>;
}
