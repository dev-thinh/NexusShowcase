import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { expect, login, test } from './fixtures';

// The production harness shares one owned schema across files; remove only this
// suite's accounts so directory counts and paging tests retain their fixtures.
test.afterEach(async ({ database, fixture }) => {
  await database.user.deleteMany({ where: { OR: ['csv-'].map(kind => ({ email: { startsWith: `${fixture.prefix}-${kind}` } })) } });
});

for (const width of [320, 1280]) test(`CSV import previews row errors and exports only newly generated credentials at ${width}px`, async ({ page, fixture, database }) => {
  await page.setViewportSize({ width, height: 900 });
  if (width === 1280) await page.addInitScript(() => Object.defineProperty(window, 'navigation', { value: undefined, configurable: true }));
  const stem = `${fixture.prefix}-csv-${width}`;
  await database.user.create({ data: { email: `${stem}-existing`, fullName: 'Tài khoản có sẵn', role: 'MEMBER', status: 'ACTIVE' } });
  await login(page, fixture.users[0], '/admin');
  await page.getByRole('navigation', { name: 'Điều hướng quản trị' }).getByRole('link', { name: 'Thành viên', exact: true }).click();
  await expect(page).toHaveURL(/admin\/members$/);
  await page.getByRole('button', { name: 'Tạo từ CSV', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Tạo tài khoản từ CSV', exact: true });
  const templateDownload = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Tải CSV mẫu', exact: true }).click();
  const template = await templateDownload;
  expect(await readFile((await template.path())!, 'utf8')).toContain('Họ tên,Tên đăng nhập/email,MSSV');
  await modal.locator('input[type="file"]').setInputFiles({ name: 'tai-khoan.csv', mimeType: 'text/csv', buffer: Buffer.from('\uFEFFHọ tên,Tên đăng nhập/email,MSSV\r\n' + `Nguyễn An CSV,${stem}-one,22120001\r\n,${stem}-missing,\r\nTrùng CSV,${stem}-existing,\r\nSai CSV,has spaces,\r\nTrần Bình CSV,${stem}-two,22120002\r\n`) });
  await expect(modal.getByRole('status').filter({ hasText: '5 dòng · 2 hợp lệ · 3 cần sửa' })).toBeVisible();
  await expect(modal.locator('[data-csv-row="3"]')).toContainText('Thiếu họ tên');
  await expect(modal.locator('[data-csv-row="4"]')).toContainText('đã tồn tại');
  await expect(modal.locator('[data-csv-row="5"]')).toContainText('không hợp lệ');
  expect(await database.user.count({ where: { email: { in: [`${stem}-one`, `${stem}-two`] } } })).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await modal.getByRole('button', { name: 'Tạo 2 tài khoản hợp lệ', exact: true }).click();
  await expect(modal.getByRole('status').filter({ hasText: '2 đã tạo · 3 bỏ qua · 0 thất bại' })).toBeVisible();
  const created = await database.user.findMany({ where: { email: { in: [`${stem}-one`, `${stem}-two`] } } });
  expect(created).toHaveLength(2);
  expect(created.every(user => user.role === 'MEMBER' && user.mustChangePassword)).toBe(true);
  const beforeBack = page.url();
  await page.evaluate(() => history.back());
  await expect(modal.getByText('Bạn chưa tải mật khẩu tạm.', { exact: false })).toBeVisible();
  await expect(page).toHaveURL(beforeBack);
  await modal.getByRole('button', { name: 'Tiếp tục tải kết quả', exact: true }).click();
  await modal.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(modal.getByText('Bạn chưa tải mật khẩu tạm.', { exact: false })).toBeVisible();
  await modal.getByRole('button', { name: 'Tiếp tục tải kết quả', exact: true }).click();
  const resultsDownload = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Tải kết quả và mật khẩu tạm', exact: true }).click();
  const downloaded = await resultsDownload;
  const csv = await readFile((await downloaded.path())!, 'utf8');
  for (const user of created) {
    const line = csv.split('\r\n').find(line => line.includes(user.email))!;
    const password = line.split(',').at(-1)!;
    expect(password.length).toBeGreaterThanOrEqual(15);
    expect(await bcrypt.compare(password, user.passwordHash!)).toBe(true);
  }
  expect(csv.split('\r\n').find(line => line.includes(`${stem}-existing`))!.endsWith(',')).toBe(true);
  await modal.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(modal).toBeHidden();
  expect(await database.user.count({ where: { email: `${stem}-missing` } })).toBe(0);
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/\/admin$/);
});

test('CSV rejects extra role columns and invalid UTF-8 before allowing creation', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/members');
  await page.getByRole('button', { name: 'Tạo từ CSV', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Tạo tài khoản từ CSV' });
  await modal.locator('input[type="file"]').setInputFiles({ name: 'roles.csv', mimeType: 'text/csv', buffer: Buffer.from('Họ tên,Tên đăng nhập/email,Quyền\nAn,new-admin,ADMIN') });
  await expect(modal.getByRole('alert')).toContainText('Không thêm cột Quyền');
  await expect(modal.getByRole('button', { name: 'Tạo 0 tài khoản hợp lệ', exact: true })).toBeDisabled();
  await modal.locator('input[type="file"]').setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from([0xff, 0xfe, 0xc0]) });
  await expect(modal.getByRole('alert')).toContainText('CSV UTF-8');
});
