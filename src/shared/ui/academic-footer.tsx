import { ClubLogo } from '@/shared/ui/club-logo';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

const footerLink = 'inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm text-[#1F2937] transition-colors hover:text-[#1F2937] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

export function AcademicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 py-10 sm:grid-cols-[minmax(0,1fr)_auto] lg:py-12">
          <div className="min-w-0">
            <Link href="/" aria-label="Trang chủ CLB Robotics & IoT - HCMUS" className="inline-flex w-72 max-w-full items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
              <ClubLogo />
            </Link>
            <p className="mt-4 max-w-md text-pretty text-sm leading-7 text-[#1F2937]">
              Chia sẻ công trình nghiên cứu khoa học, dự án và sản phẩm <span className="whitespace-nowrap">sáng tạo</span> của thành viên CLB.
            </p>
          </div>

          <nav aria-label="Khám phá CLB" className="min-w-0 w-full justify-self-start text-left sm:w-auto sm:justify-self-end">
            <h2 className="mb-3 text-sm font-semibold text-[#1F2937]">Khám phá</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:block">
              <li><Link href="/category/bai-bao-khoa-hoc" className={footerLink}>Nghiên cứu khoa học</Link></li>
              <li><Link href="/category/robotics-iot" className={footerLink}>Dự án &amp; Sản phẩm</Link></li>
              <li><Link href="/members" className={footerLink}>Thành viên</Link></li>
              <li><Link href="/contact" className={footerLink}>Liên hệ</Link></li>
            </ul>
          </nav>


        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-relaxed text-[#1F2937] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>&copy; {new Date().getFullYear()} CLB Robotics &amp; IoT - HCMUS</p>
          <p>Hỗ trợ trích dẫn BibTeX, APA và IEEE</p>
        </div>
      </div>
    </footer>
  );
}
