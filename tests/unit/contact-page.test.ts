import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Contact Page', () => {
  it('exists and displays institutional contact information', () => {
    const contactPath = path.resolve(process.cwd(), 'src/app/contact/page.tsx');
    expect(fs.existsSync(contactPath)).toBe(true);

    const content = fs.readFileSync(contactPath, 'utf-8');
    expect(content).toContain('Nguyễn Văn Cừ');
    expect(content).toContain('robotics-iot@');
    expect(content).toContain('Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM');
  });
});
