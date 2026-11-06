'use client';
import { useI18n } from '@/shared/i18n/provider';


export default function AdminError({ reset }: { reset: () => void }) {
  const { t: tr } = useI18n();

  return <section role="alert" className="rounded-xl border border-slate-200 bg-white p-6 text-center">
    <h2 className="text-lg font-semibold text-slate-900">{tr("Không tải được nội dung")}</h2>
    <p className="mt-2 text-sm text-slate-500">{tr("Vui lòng thử lại.")}</p>
    <button type="button" onClick={reset} className="action-primary-detail mt-4">{tr("Thử lại")}</button>
  </section>;
}
