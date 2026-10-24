import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import {
ExternalLink,
Globe,
Mail,
MapPin,
Phone,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <>


      <main className="container mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
      <Breadcrumbs items={[{ label: "Liên hệ" }]} />
        {/* Header */}
        <header className="mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="min-w-0">
              <span className="page-eyebrow">
                Kết nối &amp; Hợp tác
              </span>
              <h1 className="page-title">
                Liên hệ Ban Điều Hành CLB Robotics &amp; IoT
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl space-y-4">
            {/* Campus 1 */}
            <div className="panel-detail">
              <div className="mb-3">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase text-[#1F2937] tracking-wider block">
                    Cơ sở 1 (Trụ sở chính)
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-[#1F2937] leading-snug">
                    CLB Robotics &amp; IoT
                  </h2>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-[#1F2937]">
                <div className="flex items-start gap-2.5">
                  <MapPin aria-hidden="true" className="w-4 h-4 text-[#1F2937] shrink-0 mt-0.5" />
                  <span>
                    Phòng I86, Tòa nhà I, 227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail aria-hidden="true" className="w-4 h-4 text-[#1F2937] shrink-0" />
                  <a
                    href="mailto:robotics-iot@hcmus.edu.vn"
                    className="text-[#1F2937] hover:underline font-semibold"
                  >
                    robotics-iot@hcmus.edu.vn
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone aria-hidden="true" className="w-4 h-4 text-[#1F2937] shrink-0" />
                  <span>(028) 3835 4266 (Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM)</span>
                </div>
              </div>
            </div>

            {/* Academic Department Affiliation */}
            <div className="panel-nested">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
                Đơn vị chủ quản
              </h3>
              <p className="text-sm font-semibold text-[#1F2937]">
                Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#1F2937]">
                <a
                  href="https://hcmus.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#1F2937] hover:underline font-semibold"
                >
                  <Globe aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>hcmus.edu.vn</span>
                  <ExternalLink aria-hidden="true" className="w-3 h-3" />
                </a>
              </div>
            </div>

        </div>
      </main>


    </>
  );
}
