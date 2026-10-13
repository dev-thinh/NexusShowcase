import Link from 'next/link';
import { Shield, ExternalLink, GraduationCap, MapPin } from 'lucide-react';

export function AcademicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-10 text-slate-600 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-100">
          {/* Institutional Info */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="w-8 h-8 rounded-lg bg-[#2B4C6F] text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-slate-900">
                  Robotics &amp; IoT Lab Repository
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              Nền tảng công bố và lưu trữ các công trình nghiên cứu khoa học xuất bản, dự án công nghệ và thành tích của thành viên Robotics &amp; IoT Lab.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh</span>
            </div>
          </div>

          {/* Quick Academic Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
              Liên kết Học thuật
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://hcmus.edu.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Cổng ĐH Khoa học Tự nhiên</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://scholar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Google Scholar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://arxiv.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Kho bản thảo arXiv</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Standards & Guidelines */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
              Chuẩn mực Nghiên cứu
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mọi công trình tuân thủ liêm chính học thuật, hỗ trợ trích dẫn BibTeX / APA / IEEE phục vụ tham chiếu.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open Access Repository</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Robotics &amp; IoT Lab • Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM.
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Trang khám phá
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Cổng đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
