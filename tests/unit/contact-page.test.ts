import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Contact Page', () => {
  it('exists and displays institutional contact information', () => {
    const contactPath = path.resolve(process.cwd(), 'src/app/(shell)/(site)/contact/page.tsx');
    expect(fs.existsSync(contactPath)).toBe(true);

    const content = fs.readFileSync(contactPath, 'utf-8');
    expect(content).toContain('Phòng i86, Tòa nhà i, 227 Nguyễn Văn Cừ, Phường Chợ Quán, TP.HCM');
    expect(content).toContain('Zalo: 0366 399 748');
    expect(content).toContain('https://zalo.me/0366399748');
    expect(content).toContain('robotics@hcmus.edu.vn');
    expect(content).toContain('Phòng thí nghiệm Trí tuệ Nhân tạo (AILab), trường Đại học Khoa học tự nhiên, ĐHQG-HCM');
  });
});
