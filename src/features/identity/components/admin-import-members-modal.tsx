'use client';

import { useI18n } from '@/shared/i18n/provider';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { FilePicker } from '@/shared/ui/file-picker';
import { MAX_MEMBER_CSV_BYTES, MAX_MEMBER_IMPORT_ROWS, type BulkMemberRow, type BulkMemberResult } from '../model/bulk-members';
import { exportMemberCsv, MEMBER_CSV_TEMPLATE } from '../model/member-csv';
import { previewBulkMembersAction, createBulkMembersAction } from '../server/bulk-member-actions';
import { MemberCsvTable } from './member-csv-table';
import { useCredentialNavigationGuard } from './use-credential-navigation-guard';

function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdminImportMembersModal() {
  const { t: tr } = useI18n();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [rows, setRows] = useState<BulkMemberRow[]>([]);
  const [results, setResults] = useState<BulkMemberResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [discard, setDiscard] = useState(false);
  const valid = rows.filter(row => !row.errors.length).length;
  const created = results?.filter(row => row.status === 'CREATED').length ?? 0;
  const unsavedCredentials = created > 0 && !downloaded;

  useCredentialNavigationGuard(unsavedCredentials || busy && rows.length > 0, () => {
    if (locked.current) setError('Đang tạo tài khoản. Vui lòng chờ kết quả trước khi rời trang.');
    else setDiscard(true);
  });

  const finish = () => {
    setOpen(false); setCsv(''); setRows([]); setResults(null); setError(''); setDiscard(false);
    router.refresh();
  };
  const close = () => {
    if (locked.current) return;
    if (unsavedCredentials) setDiscard(true); else finish();
  };
  async function read(file?: File) {
    if (!file || locked.current || results) return;
    locked.current = true; setBusy(true); setError(''); setRows([]); setCsv('');
    try {
      if (!/\.csv$/i.test(file.name) || file.size > MAX_MEMBER_CSV_BYTES) throw new Error('Chọn file CSV UTF-8 tối đa 128 KiB.');
      let text: string;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); }
      catch { throw new Error('Không đọc được file. Hãy lưu dưới dạng CSV UTF-8.'); }
      const preview = await previewBulkMembersAction({ csv: text });
      if (!preview.success) { setError(preview.error); return; }
      setCsv(text); setRows(preview.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được bản xem trước. Vui lòng chọn lại file.'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function create() {
    if (locked.current || !valid || results || uncertain) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = await createBulkMembersAction({ csv });
      if (!result.success) { setError(result.error); return; }
      setResults(result.data); router.refresh();
    } catch {
      setUncertain(true);
      setError('Chưa xác định được kết quả tạo tài khoản. Đóng và kiểm tra lại danh sách trước khi nhập tiếp. Tài khoản đã tạo sẽ không bị ghi đè; nếu chưa nhận được mật khẩu, dùng Đặt lại mật khẩu.');
    } finally { locked.current = false; setBusy(false); }
  }
  function exportResults() {
    if (!results) return;
    try {
      downloadCsv('ket-qua-tao-tai-khoan.csv', exportMemberCsv([
        ['Dòng', 'Họ tên', 'Tên đăng nhập/email', 'MSSV', 'Kết quả', 'Chi tiết', 'Mật khẩu tạm'].map(label => tr(label)),
        ...results.map(row => [String(row.line), row.fullName, row.email, row.studentId, tr(row.status === 'CREATED' ? 'Đã tạo' : row.status === 'SKIPPED' ? 'Bỏ qua' : 'Thất bại'), tr(row.message), row.temporaryPassword ?? '']),
      ]));
      setDownloaded(true); setDiscard(false); setError('');
    } catch { setError('Không tải được kết quả. Vui lòng giữ hộp thoại mở và thử lại.'); }
  }

  return <>
    <button type="button" className="action-secondary-detail" onClick={() => { setDownloaded(false); setUncertain(false); setOpen(true); }}><FileSpreadsheet aria-hidden="true" className="h-4 w-4" />{tr("Tạo từ CSV")}</button>
    <Modal isOpen={open} onClose={close} closeDisabled={busy || unsavedCredentials} title={tr("Tạo tài khoản từ CSV")} className="!max-w-4xl">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} className="action-secondary-detail min-h-11" onClick={() => downloadCsv('mau-tai-khoan.csv', MEMBER_CSV_TEMPLATE)}><Download aria-hidden="true" className="h-4 w-4" />{tr("Tải CSV mẫu")}</button>
          {!results && <FilePicker label={tr("Tải CSV lên")} accept=".csv,text/csv" busy={busy} disabled={uncertain} onChange={event => void read(event.target.files?.[0])} />}
        </div>
        {!results && <p className="text-xs leading-5 text-slate-500">{tr("CSV UTF-8 · Tối đa {0} dòng · 128 KiB", MAX_MEMBER_IMPORT_ROWS)}</p>}
        {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />{rows.length ? tr("Đang tạo tài khoản…") : tr("Đang kiểm tra CSV…")}</p>}
        {rows.length > 0 && <>
          <p role="status" className="text-sm font-semibold text-slate-700">{results ? tr("{0} đã tạo · {1} bỏ qua · {2} thất bại", created, results.filter(row => row.status === 'SKIPPED').length, results.filter(row => row.status === 'FAILED').length) : tr("{0} dòng · {1} hợp lệ · {2} cần sửa", rows.length, valid, rows.length - valid)}</p>
          <MemberCsvTable rows={results ?? rows} />
        </>}
        {results && <div className="space-y-2">
          <button type="button" className="action-secondary-detail min-h-11" onClick={exportResults}><Download aria-hidden="true" className="h-4 w-4" />{tr("Tải kết quả và mật khẩu tạm")}</button>
        </div>}
        {error && <p role="alert" className="text-sm leading-6 text-rose-700">{tr(error)}</p>}
        {discard && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p>{tr("Bạn chưa tải mật khẩu tạm. Đóng sẽ bỏ kết quả đang giữ trong hộp thoại.")}</p>
          <div className="mt-2 flex flex-wrap gap-3"><button type="button" className="min-h-11 font-semibold underline" onClick={finish}>{tr("Đóng và bỏ kết quả")}</button><button type="button" className="min-h-11 underline" onClick={() => setDiscard(false)}>{tr("Tiếp tục tải kết quả")}</button></div>
        </div>}
        <div className="modal-footer">
          <button type="button" disabled={busy} className="action-secondary-detail min-h-11" onClick={close}>{tr("Đóng")}</button>
          {!results && <button type="button" disabled={busy || !valid || uncertain} className="action-primary-detail min-h-11 disabled:opacity-50" onClick={() => void create()}>{busy && rows.length ? tr("Đang tạo…") : tr("Tạo {0} tài khoản hợp lệ", valid)}</button>}
        </div>
      </div>
    </Modal>
  </>;
}
