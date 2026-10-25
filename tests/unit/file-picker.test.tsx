import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { FilePicker } from '@/shared/ui/file-picker';

it('keeps the native file input hidden behind a keyboard-accessible upload button', () => {
  const html = renderToStaticMarkup(<FilePicker id="avatar" label="Chọn ảnh" accept="image/png" multiple />);
  expect(html).toContain('type="file"');
  expect(html).toContain('class="hidden"');
  expect(html).toContain('type="button"');
  expect(html).toContain('aria-controls="avatar"');
  expect(html).toContain('accept="image/png"');
  expect(html).toContain('multiple=""');
  expect(html).toContain('Chọn ảnh');
});
it('disables file selection and displays progress while uploading', () => {
  const html = renderToStaticMarkup(<FilePicker busy label="Chọn ảnh" />);
  expect(html.match(/disabled=""/g)).toHaveLength(2);
  expect(html).toContain('Đang tải…');
});
