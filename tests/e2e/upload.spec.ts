import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { expect, login, test } from './fixtures';

test('uploads a PDF through a content section and serves the exact bytes only to its owner', async ({ page, fixture }) => {
  const bytes = Buffer.from(`%PDF-1.4\n% Nexus browser fixture ${randomUUID()}\n%%EOF\n`);
  let storedPath: string | undefined;
  try {
    await login(page, fixture.users[1], '/dashboard/items/new');
    await page.getByRole('button', { name: 'Thêm section', exact: true }).click();
    const section = page.getByRole('region', { name: 'Section 1', exact: true });
    await section.getByRole('button', { name: 'PDF', exact: true }).click();
    await section.getByLabel('Chọn PDF cho nội dung', { exact: true }).setInputFiles({ name: 'browser-resource.pdf', mimeType: 'application/pdf', buffer: bytes });
    const link = section.getByRole('link', { name: /browser-resource\.pdf/ });
    await expect(link).toBeVisible();
    const url = await link.getAttribute('href');
    expect(url).toMatch(/^\/uploads\/documents\/[a-zA-Z0-9_-]+\.pdf$/);
    const root = path.resolve('storage/documents');
    storedPath = path.resolve(root, path.basename(url!));
    if (path.dirname(storedPath) !== root) throw Error('Unexpected fixture upload path');
    const response = await page.request.get(url!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(await response.body()).toEqual(bytes);
    const anonymous = await page.context().browser()!.newContext();
    try {
      const denied = await anonymous.request.get(new URL(url!, page.url()).toString());
      expect(denied.status()).toBe(404);
    } finally { await anonymous.close(); }
  } finally {
    if (storedPath) {
      const root = path.resolve('storage/documents');
      if (path.dirname(storedPath) !== root || !(await readFile(storedPath)).equals(bytes)) throw Error('Refusing cleanup of a file not owned by this fixture');
      await unlink(storedPath);
    }
  }
});
