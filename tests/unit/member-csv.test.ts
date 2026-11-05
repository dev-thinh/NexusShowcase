import { describe, expect, it } from 'vitest';
import { parseMemberCsv, exportMemberCsv, MEMBER_CSV_TEMPLATE } from '@/features/identity/model/member-csv';
import { memberLoginKey } from '@/features/identity/model/bulk-members';

const header = 'Họ tên,Tên đăng nhập/email,MSSV\n';
describe('member CSV import', () => {
  it('accepts UTF-8 BOM, semicolons, reordered columns, CRLF and quoted commas/newlines/escaped quotes', () => {
    const rows = parseMemberCsv('\uFEFFMSSV;Tên đăng nhập/email;Họ tên\r\n2212;AN@example.org;"Nguyễn, \"\"An\"\""\r\n;binh;"Trần\nBình"\r\n');
    expect(rows).toMatchObject([{ line: 2, fullName: 'Nguyễn, "An"', email: 'an@example.org', studentId: '2212', errors: [] }, { line: 3, fullName: 'Trần\nBình', email: 'binh', errors: [] }]);
  });
  it('keeps invalid rows visible with field-specific errors and preserves source line numbers', () => {
    const rows = parseMemberCsv(header + 'An,an,\n\n,valid-login,\nBình,not an email,\nLong,long,1,extra\n');
    expect(rows.map(row => row.line)).toEqual([2, 4, 5, 6]);
    expect(rows[0].errors.join(' ')).toMatch(/3 ký tự/);
    expect(rows[1].errors.join(' ')).toMatch(/họ tên/);
    expect(rows[2].errors.join(' ')).toMatch(/đăng nhập/);
    expect(rows[3].errors.join(' ')).toMatch(/cột/);
  });
  it('flags every duplicate alias-family row in the input, without merging identities', () => {
    const rows = parseMemberCsv(header + 'An,2212,\nBình,2212@robotics.hcmus.edu.vn,\nLong,2212@nexus.hcmus.edu.vn,\n');
    expect(rows.every(row => row.errors.some(error => error.includes('Trùng')))).toBe(true);
    expect(memberLoginKey('  A@NEXUS.HCMUS.EDU.VN ')).toBe('a');
  });
  it('allows an omitted optional MSSV column', () => {
    expect(parseMemberCsv('Họ tên,Tên đăng nhập/email\nAn,valid-login')[0]).toMatchObject({ studentId: '', errors: [] });
  });
  it.each([
    '', header, 'Họ tên,MSSV\nAn,2212', 'Họ tên,Tên đăng nhập/email,Quyền\nAn,account,ADMIN',
    'Họ tên,Họ tên,Tên đăng nhập/email\nAn,An,account', header + '"Unclosed,account,',
    header + '"An"oops,account,', header + 'An,ac"count,',
    header + Array.from({ length: 101 }, (_, i) => `Name,account${i},`).join('\n'),
    header + 'x'.repeat(128 * 1024), header + 'Nguyễn\uFFFD,account,',
  ])('rejects malformed, empty, non-UTF-8 or oversized documents before creation', csv => {
    expect(() => parseMemberCsv(csv)).toThrow();
  });
  it('exports escaped UTF-8 CSV that cannot execute spreadsheet formulas', () => {
    const csv = exportMemberCsv([['=HYPERLINK("x")', '+test', '-test', '@test', 'Nguyễn, An', 'a"b', 'normal']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
    for (const value of ['+test', '-test', '@test']) expect(csv).toContain(`'${value}`);
    expect(csv).toContain('"Nguyễn, An"');
    expect(csv).toContain('"a""b"');
    expect(csv).toContain('normal');
  });
  it('provides the approved three-column template with no password or role column', () => {
    expect(MEMBER_CSV_TEMPLATE).toContain('Họ tên,Tên đăng nhập/email,MSSV');
    expect(MEMBER_CSV_TEMPLATE).not.toMatch(/Quyền|Mật khẩu/);
  });
});
