'use client';
import { useI18n } from '@/shared/i18n/provider';

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t: tr } = useI18n();

  return <main className="container mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"><h1 className="page-title">{tr("Không tải được trang")}</h1><p role="alert" className="mt-3 text-[#1F2937]">{tr("Vui lòng thử lại.")}</p><button onClick={reset} className="action-primary-detail mt-5">{tr("Thử lại")}</button></main>;
}
