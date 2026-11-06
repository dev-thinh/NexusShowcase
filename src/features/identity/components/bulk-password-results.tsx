'use client';
import { useState } from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/shared/i18n/provider';
import { exportMemberCsv } from '../model/member-csv';

export type PasswordResetCredential = { id: string; fullName: string; email: string; temporaryPassword: string };
export function BulkPasswordResults({ credentials, onDownloaded }: { credentials: PasswordResetCredential[]; onDownloaded: () => void }) {
  const { t: tr } = useI18n();
  const [reveal, setReveal] = useState(false);
  const download = () => {
    const csv = exportMemberCsv([[tr('Họ và tên'), 'Email', tr('Mật khẩu tạm')], ...credentials.map(row => [row.fullName, row.email, row.temporaryPassword])]);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'mat-khau-tam.csv'; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onDownloaded();
  };
  return <section aria-label={tr('Kết quả đặt lại mật khẩu')} className="space-y-4 text-left">
    <p role="status" className="text-sm font-semibold text-[#153D67]">{tr('Đã đặt lại mật khẩu cho {0} tài khoản.', credentials.length)}</p>
    <p className="text-sm leading-6 text-slate-600">{tr('Tải mật khẩu tạm trước khi đóng. Thành viên phải đổi mật khẩu khi đăng nhập lại.')}</p>
    <div className="flex flex-wrap gap-2"><button type="button" className="action-primary-detail" aria-label={tr("Tải kết quả và mật khẩu tạm")} onClick={download}><Download size={16} aria-hidden="true" />{tr('Tải mật khẩu tạm')}</button><button type="button" className="action-secondary-detail" aria-pressed={reveal} onClick={() => setReveal(value => !value)}>{reveal ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}{reveal ? tr('Ẩn mật khẩu') : tr('Hiện mật khẩu')}</button></div>
    <ul className="max-h-[40dvh] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">{credentials.map(row => <li key={row.id} className="grid min-w-0 gap-2 p-3 sm:grid-cols-2 sm:items-center"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{row.fullName}</span><span className="block truncate text-xs text-slate-500">{row.email}</span></span><input readOnly type={reveal ? 'text' : 'password'} value={row.temporaryPassword} autoComplete="off" aria-label={tr('Mật khẩu tạm của {0}', row.fullName)} className="min-w-0 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 font-mono text-xs" /></li>)}</ul>
  </section>;
}
