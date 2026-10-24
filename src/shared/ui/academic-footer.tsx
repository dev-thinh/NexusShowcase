import { ExternalLink } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

const footerLink = 'inline-flex min-h-10 items-center gap-1.5 rounded-sm text-sm text-[#1F2937] transition-colors hover:text-[#1F2937] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

export function AcademicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 py-10 sm:grid-cols-2 lg:grid-cols-12 lg:py-12">
          <div className="min-w-0 sm:col-span-2 lg:col-span-6">
            <Link href="/" aria-label="Trang chủ CLB Robotics & IoT" className="inline-flex max-w-full items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
              <span
                aria-hidden="true"
                className="h-12 w-8 shrink-0 bg-brand-button"
                style={{
                  maskImage: 'url(/logo.svg)',
                  maskSize: 'contain',
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                  WebkitMaskImage: 'url(/logo.svg)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                }}
              />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug tracking-tight text-[#1F2937]">CLB Robotics &amp; IoT</p>
                <p className="mt-1 text-xs leading-relaxed text-[#1F2937]">Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM</p>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#1F2937]">
              Chia sẻ công trình nghiên cứu khoa học, dự án và sản phẩm sáng tạo của thành viên CLB.
            </p>
          </div>

          <nav aria-label="Khám phá CLB" className="min-w-0 lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold text-[#1F2937]">Khám phá</h2>
            <ul>
              <li><Link href="/category/bai-bao-khoa-hoc" className={footerLink}>Nghiên cứu khoa học</Link></li>
              <li><Link href="/category/robotics-iot" className={footerLink}>Robotics &amp; IoT</Link></li>
              <li><Link href="/members" className={footerLink}>Thành viên</Link></li>
              <li><Link href="/contact" className={footerLink}>Liên hệ</Link></li>
            </ul>
          </nav>

          <nav aria-label="Liên kết học thuật" className="min-w-0 lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold text-[#1F2937]">Liên kết học thuật</h2>
            <ul>
              <li><a href="https://hcmus.edu.vn" target="_blank" rel="noopener noreferrer" className={footerLink}>ĐH Khoa học Tự nhiên<ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#1F2937]" /></a></li>
              <li><a href="https://scholar.google.com" target="_blank" rel="noopener noreferrer" className={footerLink}>Google Scholar<ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#1F2937]" /></a></li>
              <li><a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className={footerLink}>arXiv<ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#1F2937]" /></a></li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-relaxed text-[#1F2937] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>&copy; {new Date().getFullYear()} CLB Robotics &amp; IoT.</p>
          <p>Hỗ trợ trích dẫn BibTeX, APA và IEEE.</p>
        </div>
      </div>
    </footer>
  );
}
