import { Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail } from 'lucide-react';

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
  title: 'Đăng nhập - Robotics & IoT Lab',
  description: 'Cổng xác thực nghiên cứu khoa học và sản phẩm công nghệ - Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM',
};

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden selection:bg-slate-900 selection:text-white">
      {/* 1. Header (Navbar) giữ nguyên đồng bộ toàn website */}
      <Navbar />

      {/* Họa tiết ánh sáng gradient nền mềm mại theo mẫu hero học thuật */}
      <div className="absolute top-16 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4" />
      <div className="absolute top-16 right-0 w-96 h-96 bg-purple-100/35 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-100/25 rounded-full blur-3xl pointer-events-none" />

      {/* 2. Main Hero Layout: Căn lề 2 bên chuẩn container */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-10 lg:py-12 relative z-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Panel nhận diện thương hiệu Robotics & IoT Lab */}
          <div className="mb-6 lg:mb-8">
            <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 p-1.5 pr-3.5 sm:pr-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2B4C6F] text-white text-xs font-bold tracking-wide shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Robotics &amp; IoT Lab</span>
              </div>
              <div className="hidden sm:block h-3.5 w-px bg-slate-200" />
              <span className="text-xs sm:text-[13px] font-semibold text-slate-700 tracking-tight">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
              </span>
            </div>
          </div>

          {/* 
            Lưới 2 cột: Căn ngang mép trên giữa Tiêu đề và Form đăng nhập 
            (items-start đảm bảo tiêu đề in đậm căn ngang mép trên của form)
          */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* 
              CỘT BÊN TRÁI: TIÊU ĐỀ & NỘI DUNG GIỚI THIỆU
              (Tiêu đề h1 bắt đầu ngay từ mép trên, căn ngang với mép trên của form)
            */}
            <aside className="lg:col-span-7 xl:col-span-7 space-y-6">
              {/* Tiêu đề lớn tạo điểm nhấn học thuật & công nghệ */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-black text-slate-900 tracking-tight leading-[1.12]">
                Ươm mầm nghiên cứu <br className="hidden sm:inline" />
                &amp; Sáng tạo công nghệ.
              </h1>

              {/* Nội dung giới thiệu sứ mệnh & mục tiêu câu lạc bộ */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Không gian nghiên cứu tại Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM. Nơi kết nối sinh viên đam mê công nghệ, lưu trữ các đề tài nghiên cứu khoa học, khóa luận xuất sắc và phát triển các giải pháp Robotics &amp; IoT tiên phong.
              </p>

              {/* 2 Nút điều hướng: 1 là Trang chủ, 2 là Liên hệ */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#2B4C6F] hover:bg-[#1F3750] text-white text-sm font-bold shadow-xs transition-all active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span>Trang chủ</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold border border-slate-300 shadow-2xs transition-all active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>Liên hệ</span>
                </Link>
              </div>
            </aside>

            {/* 
              CỘT BÊN PHẢI: FORM ĐĂNG NHẬP
              (Mép trên của form căn ngang với mép trên của tiêu đề h1)
            */}
            <div className="lg:col-span-5 xl:col-span-5 w-full">
              <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
