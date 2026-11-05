import { z } from 'zod';
import { normalizeSearchText } from '@/shared/lib/search-text';
import { MAX_MEMBER_CSV_BYTES, MAX_MEMBER_IMPORT_ROWS, memberLoginKey, type BulkMemberRow } from './bulk-members';

/** UTF-8 BOM makes Vietnamese text readable in Excel. */
export const MEMBER_CSV_TEMPLATE = '\uFEFFHọ tên,Tên đăng nhập/email,MSSV\r\nNguyễn Văn An,22120001,22120001\r\n';

function readCells(csv: string) {
  const firstLine = csv.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  const rows: Array<{ line: number; cells: string[] }> = [];
  let cells: string[] = [], cell = '', quoted = false, closed = false, line = 1, start = 1;
  const endCell = () => { cells.push(cell.trim()); cell = ''; closed = false; };
  const endRow = () => {
    endCell();
    if (cells.some(value => value !== '')) rows.push({ line: start, cells });
    cells = [];
    if (rows.length > MAX_MEMBER_IMPORT_ROWS + 1) throw new Error(`Mỗi lần nhập tối đa ${MAX_MEMBER_IMPORT_ROWS} tài khoản.`);
  };
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted) {
        if (csv[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; }
      } else if (!closed && !cell.trim()) { cell = ''; quoted = true; }
      else throw new Error(`Dấu ngoặc kép không hợp lệ ở dòng ${line}.`);
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && csv[i + 1] === '\n') i++;
      if (quoted) cell += '\n'; else { endRow(); start = line + 1; }
      line++;
    } else if (quoted) cell += char;
    else if (char === delimiter) endCell();
    else if (closed) {
      if (!/\s/.test(char)) throw new Error(`Ký tự sau dấu ngoặc kép không hợp lệ ở dòng ${line}.`);
    } else cell += char;
  }
  if (quoted) throw new Error('CSV có ô chưa đóng dấu ngoặc kép.');
  if (cell || cells.length || closed) endRow();
  return rows;
}

export function parseMemberCsv(value: string): BulkMemberRow[] {
  if (new TextEncoder().encode(value).length > MAX_MEMBER_CSV_BYTES) throw new Error('CSV tối đa 128 KiB.');
  if (/[\uFFFD\u0000]/.test(value)) throw new Error('Không đọc được nội dung. Hãy lưu file dưới dạng CSV UTF-8.');
  const [header, ...records] = readCells(value.replace(/^\uFEFF/, ''));
  if (!header) throw new Error('CSV trống. Hãy tải CSV mẫu và điền dữ liệu.');
  const headers = header.cells.map(cell => normalizeSearchText(cell.trim()).replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/'));
  const allowed = ['ho ten', 'ten dang nhap/email', 'mssv'];
  if (headers.some(column => !allowed.includes(column)) || new Set(headers).size !== headers.length || !headers.includes('ho ten') || !headers.includes('ten dang nhap/email')) {
    throw new Error('Tiêu đề cột không đúng mẫu. Cần Họ tên, Tên đăng nhập/email; MSSV là cột tùy chọn. Không thêm cột Quyền hoặc Mật khẩu.');
  }
  if (!records.length) throw new Error('CSV chưa có tài khoản nào.');
  const rows = records.map(({ line, cells }) => {
    const get = (name: string) => cells[headers.indexOf(name)] ?? '';
    const fullName = get('ho ten'), email = get('ten dang nhap/email').toLowerCase(), studentId = get('mssv');
    const errors: string[] = [];
    if (cells.length !== headers.length) errors.push('Số cột không khớp tiêu đề.');
    if (!fullName) errors.push('Thiếu họ tên.');
    else if (fullName.length > 200) errors.push('Họ tên tối đa 200 ký tự.');
    if (!email) errors.push('Thiếu tên đăng nhập/email.');
    else if (email.length < 3) errors.push('Tên đăng nhập cần ít nhất 3 ký tự.');
    else if (email.length > 254 || (email.includes('@') ? !z.email().safeParse(email).success : !/^[a-z\d._-]+$/i.test(email))) errors.push('Tên đăng nhập/email không hợp lệ (tên đăng nhập chỉ gồm chữ Latin, số, dấu chấm, gạch dưới hoặc gạch ngang).');
    if (studentId.length > 64) errors.push('MSSV tối đa 64 ký tự.');
    return { line, fullName, email, studentId, errors };
  });
  const occurrences = new Map<string, number>();
  for (const row of rows) if (row.email) occurrences.set(memberLoginKey(row.email), (occurrences.get(memberLoginKey(row.email)) ?? 0) + 1);
  for (const row of rows) if (row.email && occurrences.get(memberLoginKey(row.email))! > 1) row.errors.push('Trùng tên đăng nhập/email trong CSV (kể cả tên miền Robotics/Nexus).');
  return rows;
}

/** CSV quoting alone does not prevent spreadsheet formula execution. */
export function exportMemberCsv(rows: string[][]): string {
  return '\uFEFF' + rows.map(row => row.map(cell => {
    const safe = /^[\s]*[=+\-@]|^[\t\r\n]/.test(cell) ? `'${cell}` : cell;
    return /[",\r\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }).join(',')).join('\r\n') + '\r\n';
}
