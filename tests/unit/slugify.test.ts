import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/slugify';

describe('Slugify Generator', () => {
  it('should transform Vietnamese diacritics into url-friendly slug', () => {
    const title = 'Ứng Dụng Học Sâu Trong Phân Đoạn Ảnh Y Tế 2026!';
    expect(slugify(title)).toBe('ung-dung-hoc-sau-trong-phan-doan-anh-y-te-2026');
  });
});
