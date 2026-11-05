import type { BulkMemberRow, BulkMemberResult } from '../model/bulk-members';

export function MemberCsvTable({ rows }: { rows: Array<BulkMemberRow | BulkMemberResult> }) {
  return <div className="max-h-[40dvh] min-w-0 overflow-auto rounded-lg border border-slate-200">
    <table className="w-full min-w-[40rem] text-left text-sm">
      <caption className="sr-only">Danh sách tài khoản từ CSV và kết quả kiểm tra từng dòng</caption>
      <thead className="sticky top-0 bg-slate-50 text-xs text-slate-600"><tr>{['Dòng', 'Họ tên', 'Tên đăng nhập/email', 'MSSV', 'Kết quả'].map(label => <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-200">{rows.map(row => {
        const result = 'status' in row ? row : null;
        const invalid = !!row.errors.length || result?.status === 'FAILED';
        return <tr key={row.line} data-csv-row={row.line} className={invalid ? 'bg-rose-50/70' : result?.status === 'CREATED' ? 'bg-emerald-50/50' : ''}>
          <th scope="row" className="px-3 py-3 align-top font-normal tabular-nums">{row.line}</th>
          <td className="max-w-[12rem] break-words px-3 py-3 align-top">{row.fullName || '—'}</td>
          <td className="max-w-[12rem] break-all px-3 py-3 align-top">{row.email || '—'}</td>
          <td className="max-w-[8rem] break-words px-3 py-3 align-top">{row.studentId || '—'}</td>
          <td className={`min-w-48 max-w-xs px-3 py-3 align-top text-xs leading-5 ${invalid ? 'text-rose-700' : 'text-slate-600'}`}>
            {result ? <><strong>{result.status === 'CREATED' ? 'Đã tạo' : result.status === 'SKIPPED' ? 'Bỏ qua' : 'Tạo thất bại'}</strong><p>{result.message}</p></> : row.errors.length ? <><strong>Cần sửa</strong><ul className="list-inside list-disc">{row.errors.map((error, index) => <li key={index}>{error}</li>)}</ul></> : <strong className="text-emerald-700">Hợp lệ</strong>}
          </td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
