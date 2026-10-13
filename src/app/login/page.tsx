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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* 
              CỘT BÊN TRÁI: MỤC TIÊU ROBOTICS & IOT LAB
              (Cùng tone màu sáng đồng nhất, typography đậm rõ nét, 2 nút bên dưới)
            */}
            <aside className="lg:col-span-7 xl:col-span-7 space-y-6">
              {/* Pill tag nhận diện Robotics & IoT Lab */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs sm:text-[13px] font-semibold text-slate-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />
                <span>Robotics &amp; IoT Lab · Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM</span>
              </div>

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
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-xs transition-all active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-300" />
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
              (Thay thế hình minh họa bằng thẻ đăng nhập nổi bật)
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
