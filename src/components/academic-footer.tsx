import Link from 'next/link';
import { Shield, ExternalLink, GraduationCap, BookOpen, MapPin, Mail } from 'lucide-react';

export function AcademicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-white py-12 text-slate-600 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-100">
          {/* Institutional Info */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="w-8 h-8 rounded-lg bg-[#0F294A] text-white flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-tight text-slate-900">
                  NexusShowcase Academic Repository
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Khoa Công nghệ Thông tin • ĐH Khoa học Tự nhiên - ĐHQG-HCM
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Hệ thống lưu trữ, trưng bày và công bố các công trình nghiên cứu khoa học xuất bản, dự án công nghệ tiên phong và thành tích/cống hiến của cộng đồng nghiên cứu sinh viên CLB Nexus.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh</span>
            </div>
          </div>

          {/* Quick Academic Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Liên kết Học thuật
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.fit.hcmus.edu.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0F294A] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Cổng Khoa CNTT HCMUS</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://scholar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0F294A] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Google Scholar</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://arxiv.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0F294A] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Kho bản thảo arXiv</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Standards & Guidelines */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Chuẩn mực Nghiên cứu
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mọi công trình công bố tuân thủ chuẩn liêm chính học thuật, hỗ trợ xuất trích dẫn BibTeX / APA / IEEE phục vụ tham chiếu và tái lập nghiên cứu.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                <Shield className="w-3 h-3 text-emerald-600" />
                <span>Open Access Academic Repository</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Nexus Academic Showcase • Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM.
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/" className="hover:text-[#0F294A] transition-colors">
              Trang khám phá
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-[#0F294A] transition-colors">
              Cổng đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
