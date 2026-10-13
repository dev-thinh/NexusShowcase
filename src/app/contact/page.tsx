'use client';

import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  Building,
  GraduationCap,
  Send,
  MessageSquare,
  Globe,
  ExternalLink,
} from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl flex-1">
        {/* Header */}
        <header className="mb-12 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
              <Mail className="w-6 h-6 text-[#0F294A]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kết nối &amp; Hợp tác
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
                Liên hệ Ban Điều Hành CLB Nexus
              </h1>
            </div>
          </div>
          <p className="text-base text-slate-600 max-w-3xl leading-relaxed mt-2">
            Mọi thông tin liên hệ trao đổi học thuật, đề xuất hợp tác nghiên cứu, chuyển giao công nghệ
            hoặc tham gia sinh hoạt cùng CLB Nexus - Khoa Công nghệ Thông tin,
            Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Institutional Info Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Campus 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">
                    Cơ sở 1 (Trụ sở chính)
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Phòng Lab Nghiên cứu Khoa CNTT
                  </h2>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Phòng E302, Nhà E, 227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href="mailto:nexus@fit.hcmus.edu.vn"
                    className="text-[#0F294A] hover:underline font-semibold"
                  >
                    nexus@fit.hcmus.edu.vn
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>(028) 3835 4266 (Khoa Công nghệ Thông tin)</span>
                </div>
              </div>
            </div>

            {/* Campus 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">
                    Cơ sở 2 (Cơ sở Đào tạo &amp; Thực nghiệm)
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Khu Đô Thị ĐHQG-HCM
                  </h2>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Tòa nhà Điều hành &amp; Giảng đường, Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Lịch sinh hoạt thực nghiệm: Thứ 4 &amp; Thứ 7 hàng tuần</span>
                </div>
              </div>
            </div>

            {/* Academic Department Affiliation */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Đơn vị bảo trợ học thuật
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                Khoa Công nghệ Thông tin — Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                <a
                  href="https://fit.hcmus.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>fit.hcmus.edu.vn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://hcmus.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-700 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>hcmus.edu.vn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-[#0F294A]" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                Gửi Tin Nhắn Kết Nối
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Vui lòng điền thông tin để gửi tin nhắn trực tiếp đến Ban Chủ nhiệm CLB Nexus.
            </p>

            <form
              action="#"
              method="POST"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Cảm ơn bạn đã liên hệ! Thông điệp sẽ được gửi đến Ban Điều Hành CLB Nexus.');
              }}
            >
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@student.hcmus.edu.vn"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                  Đơn vị / Lớp / Doanh nghiệp
                </label>
                <input
                  type="text"
                  placeholder="Khoa CNTT - Khóa 2022 / Doanh nghiệp đối tác"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                  Chủ đề
                </label>
                <input
                  type="text"
                  required
                  placeholder="Hợp tác nghiên cứu / Đóng góp đề tài..."
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                  Nội dung trao đổi
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả chi tiết nội dung bạn muốn trao đổi cùng CLB Nexus..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi lời nhắn</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}
