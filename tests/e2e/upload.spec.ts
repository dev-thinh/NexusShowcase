import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { acknowledgeSuccess, expect, login, test } from './fixtures';

test('uploads an author resource through the editor and downloads the exact PDF', async ({ page, fixture }) => {
  const bytes = Buffer.from(`%PDF-1.4\n% Nexus browser fixture ${randomUUID()}\n%%EOF\n`);
  let storedPath: string | undefined;
  try {
    await login(page, fixture.users[1], '/dashboard/items/new');
    await page.getByRole('button', { name: 'Thêm tài nguyên', exact: true }).click();
    await page.getByRole('button', { name: 'Tệp', exact: true }).click();
    await page.getByLabel('Chọn tệp cho tài nguyên 1').setInputFiles({ name: 'browser-resource.pdf', mimeType: 'application/pdf', buffer: bytes });
    await acknowledgeSuccess(page, 'Đã tải tệp lên. Lưu bản nháp để giữ thay đổi.');
    const link = page.getByRole('link', { name: 'browser-resource.pdf', exact: true });
    const url = await link.getAttribute('href');
    expect(url).toMatch(/^\/uploads\/resources\/[a-zA-Z0-9_-]+\.pdf$/);
    const root = path.resolve('storage/resources');
    storedPath = path.resolve(root, path.basename(url!));
    if (path.dirname(storedPath) !== root) throw Error('Unexpected fixture upload path');
    const response = await page.request.get(url!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('application/octet-stream');
    expect(response.headers()['content-disposition']).toContain('attachment;');
    expect(response.headers()['content-disposition']).toContain('.pdf');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(await response.body()).toEqual(bytes);
  } finally {
    if (storedPath) {
      const root = path.resolve('storage/resources');
      if (path.dirname(storedPath) !== root || !(await readFile(storedPath)).equals(bytes)) throw Error('Refusing cleanup of a file not owned by this fixture');
      await unlink(storedPath);
    }
  }
});
