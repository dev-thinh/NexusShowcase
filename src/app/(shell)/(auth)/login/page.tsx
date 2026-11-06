import { localizedMetadata } from '@/shared/i18n/metadata';

import { getServerI18n } from '@/shared/i18n/server';
import { ClubLogo } from '@/shared/ui/club-logo';
import { LoginForm } from '@/features/identity/components/login-form';
import { FormSkeleton } from '@/shared/ui/content-skeletons';
import { ArrowLeft, Mail } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { Suspense } from 'react';

export const generateMetadata = localizedMetadata({
  title: 'Đăng nhập',
  description: 'Đăng nhập để chia sẻ công trình và kết nối cùng CLB Robotics & IoT - HCMUS.',
});

export default async function LoginPage() {
  const { t: tr } = await getServerI18n();

  return <div className="flex flex-1 flex-col bg-background relative overflow-hidden selection:bg-[#153D67] selection:text-white">

    <div className="absolute top-16 left-0 w-96 h-96 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4" />
    <div className="absolute top-16 right-0 w-96 h-96 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
    <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none" />
    <main className="flex-1 flex items-start justify-center py-6 sm:py-8 lg:items-center lg:py-12 relative z-10">
      <div className="container w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <aside className="hidden lg:block lg:col-span-7 xl:col-span-7 space-y-5">
            <div data-brand-lockup="login" className="w-[232px] max-w-full py-1">
              <ClubLogo />
            </div>
            <h1 className="login-title text-[#1F2937]"><span>{tr("Cùng nghiên cứu.")}</span><span className="text-[#153D67]">{tr("Cùng sáng tạo.")}</span></h1>
            <p className="login-copy text-base text-slate-600 leading-relaxed font-normal">{tr("Chia sẻ công trình, kết nối thành viên và phát triển ý tưởng Robotics & IoT.")}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-button hover:brightness-110 text-white text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"><ArrowLeft aria-hidden="true" className="w-4 h-4 text-white/80" /><span>{tr("Trang chủ")}</span></Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-[#FFFFFF] text-[#1F2937] text-sm font-semibold border border-slate-200 shadow-2xs transition-all active:scale-[0.98]"><Mail className="w-4 h-4 text-[#1F2937]" /><span>{tr("Liên hệ")}</span></Link>
            </div>
          </aside>
          <div className="lg:col-span-5 xl:col-span-5 w-full">
            <Suspense fallback={<FormSkeleton />}><LoginForm /></Suspense>
            <nav aria-label={tr("Điều hướng đăng nhập")} className="mx-auto mt-5 flex max-w-lg items-center justify-center gap-6 text-sm text-slate-600 lg:hidden">
              <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-sm hover:text-[#153D67]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{tr("Trang chủ")}</Link>
              <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-sm hover:text-[#153D67]"><Mail className="h-4 w-4" aria-hidden="true" />{tr("Liên hệ")}</Link>
            </nav>
          </div>
        </div>
      </div>
    </main>
  </div>;
}
