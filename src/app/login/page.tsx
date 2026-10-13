import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  ArrowLeft,
  Mail,
  BookOpen,
  Cpu,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

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
  description: 'Cổng xác thực nghiên cứu khoa học và sản phẩm công nghệ sinh viên Khoa CNTT - ĐH Khoa học Tự nhiên ĐHQG-HCM',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col lg:flex-row font-sans overflow-x-hidden lg:overflow-hidden bg-slate-50">
      {/* 
        CỘT BÊN TRÁI: GIỚI THIỆU SỨ MỆNH & MỤC TIÊU CLB NEXUS 
        (Deep Academic Navy theme, tương phản cao, chuyên nghiệp)
      */}
      <aside className="w-full lg:w-5/12 xl:w-5/12 bg-[#0F294A] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
        {/* Họa tiết trang trí chìm học thuật */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-60 h-60 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        {/* 1. Header Cột Trái: Logo & Tên đơn vị */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:bg-white/20 transition-colors shrink-0">
              <GraduationCap className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white block leading-tight">
                NexusShowcase
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 tracking-wider uppercase block">
                Khoa CNTT • ĐH Khoa học Tự nhiên
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Nội dung chính Cột Trái: Mục tiêu & Giá trị cốt lõi */}
        <div className="relative z-10 my-8 lg:my-auto space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-amber-300 text-xs font-bold mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>CÂU LẠC BỘ HỌC THUẬT NEXUS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Ươm mầm nghiên cứu, <br className="hidden sm:inline" />
              Kiến tạo công nghệ tương lai.
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Không gian số lưu trữ, thẩm định và vinh danh các bài báo khoa học, sản phẩm công nghệ tiên phong của sinh viên và giảng viên Khoa Công nghệ Thông tin.
            </p>
          </div>

          {/* 3 Mục tiêu trọng tâm */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
              <BookOpen className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">Xuất bản &amp; Lưu trữ Công trình</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-normal">
                  Hệ thống hóa các đề tài NCKH, bài báo hội nghị quốc tế và khóa luận tốt nghiệp xuất sắc.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
              <Cpu className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">Dự án Công nghệ &amp; Ứng dụng</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-normal">
                  Thực hiện các sản phẩm mã nguồn mở, đồ án IoT, AI và giải pháp phần mềm thực tiễn.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">Thẩm định &amp; Vinh danh Học thuật</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-normal">
                  Quy trình bình duyệt chuẩn mực, kết nối cố vấn chuyên môn và vinh danh thành viên nòng cốt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer Cột Trái: 2 Nút điều hướng thoát (Trang chủ & Liên hệ) */}
        <div className="relative z-10 pt-4 border-t border-white/15 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all hover:-translate-y-0.5 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>Trang chủ</span>
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all hover:-translate-y-0.5 shadow-xs"
            >
              <Mail className="w-4 h-4 text-slate-300" />
              <span>Liên hệ ban điều hành</span>
            </Link>
          </div>

          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} NexusShowcase • Đại học Khoa học Tự nhiên - ĐHQG-HCM
          </p>
        </div>
      </aside>

      {/* 
        CỘT BÊN PHẢI: FORM ĐĂNG NHẬP 
        (Sạch sẽ, tập trung, chuẩn UX học thuật)
      */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 min-h-0 bg-slate-50/70">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
