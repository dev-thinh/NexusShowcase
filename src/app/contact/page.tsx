import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ContactForm } from '@/components/contact-form';
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  Building,
  GraduationCap,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl flex-1">
        {/* Header */}
        <header className="mb-8 pb-6 border-b border-slate-200">
          <div className="heading-gutter">
            <Mail aria-hidden="true" className="heading-gutter-icon w-5 h-5 sm:w-8 sm:h-8 text-[#0F294A] mt-0.5 sm:mt-1" />
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Kết nối &amp; Hợp tác
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Liên hệ Ban Điều Hành Robotics &amp; IoT Lab
              </h1>
              <p className="text-sm text-slate-600 truncate max-w-3xl mt-1">
                Mọi thông tin liên hệ trao đổi học thuật, đề xuất hợp tác nghiên cứu hoặc tham gia sinh hoạt cùng Robotics &amp; IoT Lab.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Institutional Info Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Campus 1 */}
            <div className="panel-detail">
              <div className="heading-gutter mb-3">
                <Building aria-hidden="true" className="heading-gutter-icon w-5 h-5 sm:w-6 sm:h-6 text-blue-700 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase text-blue-700 tracking-wider block">
                    Cơ sở 1 (Trụ sở chính)
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Phòng Lab Nghiên cứu Robotics &amp; IoT
                  </h2>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Phòng E302, Nhà E, 227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href="mailto:robotics-iot@hcmus.edu.vn"
                    className="text-[#0F294A] hover:underline font-semibold"
                  >
                    robotics-iot@hcmus.edu.vn
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>(028) 3835 4266 (Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM)</span>
                </div>
              </div>
            </div>

            {/* Campus 2 */}
            <div className="panel-detail">
              <div className="heading-gutter mb-3">
                <GraduationCap aria-hidden="true" className="heading-gutter-icon w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider block">
                    Cơ sở 2 (Cơ sở Đào tạo &amp; Thực nghiệm)
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Khu Đô Thị ĐHQG-HCM
                  </h2>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Tòa nhà Điều hành &amp; Giảng đường, Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Lịch sinh hoạt thực nghiệm: Thứ 4 &amp; Thứ 7 hàng tuần</span>
                </div>
              </div>
            </div>

            {/* Academic Department Affiliation */}
            <div className="panel-nested">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Đơn vị chủ quản
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                <a
                  href="https://hcmus.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-700 hover:underline font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>hcmus.edu.vn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form (5 cols) */}
          <div className="lg:col-span-5">
            <ContactForm />
          </div>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}
