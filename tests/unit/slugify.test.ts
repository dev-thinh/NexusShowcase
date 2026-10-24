import { slugify } from '@/shared/lib/slugify';
import { describe, expect, it } from 'vitest';

describe('Slugify Generator', () => {
  it('should transform Vietnamese diacritics into url-friendly slug', () => {
    const title = 'Ứng Dụng Học Sâu Trong Phân Đoạn Ảnh Y Tế 2026!';
    expect(slugify(title)).toBe('ung-dung-hoc-sau-trong-phan-doan-anh-y-te-2026');
  });
});
