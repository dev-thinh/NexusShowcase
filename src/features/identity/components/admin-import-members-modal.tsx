'use client';

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
        ['Dòng', 'Họ tên', 'Tên đăng nhập/email', 'MSSV', 'Kết quả', 'Chi tiết', 'Mật khẩu tạm'],
        ...results.map(row => [String(row.line), row.fullName, row.email, row.studentId, row.status === 'CREATED' ? 'Đã tạo' : row.status === 'SKIPPED' ? 'Bỏ qua' : 'Thất bại', row.message, row.temporaryPassword ?? '']),
      ]));
      setDownloaded(true); setDiscard(false); setError('');
    } catch { setError('Không tải được kết quả. Vui lòng giữ hộp thoại mở và thử lại.'); }
  }

  return <>
    <button type="button" className="action-secondary-detail" onClick={() => { setDownloaded(false); setUncertain(false); setOpen(true); }}><FileSpreadsheet aria-hidden="true" className="h-4 w-4" />Tạo từ CSV</button>
    <Modal isOpen={open} onClose={close} closeDisabled={busy || unsavedCredentials} title="Tạo tài khoản từ CSV" description="Tải mẫu, điền dữ liệu rồi tải lên để kiểm tra trước khi tạo. Tất cả tài khoản mới đều là Thành viên." className="!max-w-4xl">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} className="action-secondary-detail min-h-11" onClick={() => downloadCsv('mau-tai-khoan.csv', MEMBER_CSV_TEMPLATE)}><Download aria-hidden="true" className="h-4 w-4" />Tải CSV mẫu</button>
          {!results && <FilePicker label="Tải CSV lên" accept=".csv,text/csv" busy={busy} disabled={uncertain} onChange={event => void read(event.target.files?.[0])} />}
        </div>
        {!results && <p className="text-xs leading-5 text-slate-500">Họ tên và Tên đăng nhập/email là bắt buộc; MSSV có thể để trống. Xóa dòng ví dụ trong mẫu trước khi điền. Lưu dạng CSV UTF-8, tối đa {MAX_MEMBER_IMPORT_ROWS} dòng và 128 KiB. Không cần nhập quyền hay mật khẩu.</p>}
        {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />{rows.length ? 'Đang tạo tài khoản…' : 'Đang kiểm tra CSV…'}</p>}
        {rows.length > 0 && <>
          <p role="status" className="text-sm font-semibold text-slate-700">{results ? `${created} đã tạo · ${results.filter(row => row.status === 'SKIPPED').length} bỏ qua · ${results.filter(row => row.status === 'FAILED').length} thất bại` : `${rows.length} dòng · ${valid} hợp lệ · ${rows.length - valid} cần sửa`}</p>
          <MemberCsvTable rows={results ?? rows} />
        </>}
        {results && <div className="space-y-2">
          <button type="button" className="action-secondary-detail min-h-11" onClick={exportResults}><Download aria-hidden="true" className="h-4 w-4" />Tải kết quả và mật khẩu tạm</button>
          {created > 0 && <p className="text-xs leading-5 text-slate-500">Mật khẩu tạm chỉ có trong kết quả lần này. Tải kết quả trước khi đóng và chuyển cho từng thành viên; họ phải đổi mật khẩu ở lần đăng nhập đầu.</p>}
        </div>}
        {error && <p role="alert" className="text-sm leading-6 text-rose-700">{error}</p>}
        {discard && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p>Bạn chưa tải mật khẩu tạm. Đóng sẽ bỏ kết quả đang giữ trong hộp thoại.</p>
          <div className="mt-2 flex flex-wrap gap-3"><button type="button" className="min-h-11 font-semibold underline" onClick={finish}>Đóng và bỏ kết quả</button><button type="button" className="min-h-11 underline" onClick={() => setDiscard(false)}>Tiếp tục tải kết quả</button></div>
        </div>}
        <div className="modal-footer">
          <button type="button" disabled={busy} className="action-secondary-detail min-h-11" onClick={close}>Đóng</button>
          {!results && <button type="button" disabled={busy || !valid || uncertain} className="action-primary-detail min-h-11 disabled:opacity-50" onClick={() => void create()}>{busy && rows.length ? 'Đang tạo…' : `Tạo ${valid} tài khoản hợp lệ`}</button>}
        </div>
      </div>
    </Modal>
  </>;
}
