import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('@/shared/ui/modal', () => ({ Modal: ({ title, children }: { title: string; children: ReactNode }) => <div role="dialog" aria-label={title}>{children}</div> }));
import { MomentsEditor } from '@/features/publications/components/moments-editor';
import { defaultResearchImages } from '../fixtures/moments';
import { defaultMoments } from '../fixtures/moments';

it('uses the shared modal editor with three fixed research slots', () => {
  const html = renderToStaticMarkup(<MomentsEditor variant="research" gallery={{ version: 0, photos: defaultResearchImages }} sharedLibrary={{ version: 0, photos: defaultMoments }} onSave={() => {}} onCancel={() => {}} />);
  expect(html).toContain('aria-label="Chỉnh sửa ảnh hướng nghiên cứu"');
  expect(html.match(/data-moment-slot=/g)).toHaveLength(3);
  expect(html).toContain('Tải ảnh mới vào thư viện');
  expect(html).toContain(defaultMoments[0].src);
  expect(html.match(/class="moments-editor__asset"/g)).toHaveLength(6);
  expect(html).toContain('Lưu thay đổi');
  expect(html).toContain('Gỡ ảnh');
  expect(html).not.toContain('Khung ảnh');
  expect(html).not.toContain('moments-editor__preview-label');
  expect(html).toContain('aria-label="Di chuyển ảnh"');
  expect(html).not.toContain('<select');
  expect(html).not.toContain('Bấm ảnh chưa sử dụng');
  expect(html).not.toContain('<h4>Ảnh đang hiển thị</h4>');
});
it('keeps twelve slots and library controls for the moments editor', () => {
  const html = renderToStaticMarkup(<MomentsEditor gallery={{ version: 0, photos: defaultMoments }} onSave={() => {}} onCancel={() => {}} />);
  expect(html.match(/data-moment-slot=/g)).toHaveLength(12);
  expect(html).toContain('Gỡ ảnh');
  expect(html).toContain('Tải ảnh mới vào thư viện');
  expect(html).not.toContain('moments-editor__preview-label');
  expect(html).toContain('moments-editor__photo-actions');
  expect(html).toContain('lucide-image-minus');
  expect(html).not.toContain('<select');
  expect(html).toContain('role="combobox"');
});
