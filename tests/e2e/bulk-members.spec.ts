import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { acknowledgeSuccess, expect, login, test } from './fixtures';

// The production harness shares one owned schema across files; remove only this
// suite's accounts so directory counts and paging tests retain their fixtures.
test.afterEach(async ({ database, fixture }) => {
  await database.user.deleteMany({ where: { OR: ['csv-', 'grant-', 'stale-grant-'].map(kind => ({ email: { startsWith: `${fixture.prefix}-${kind}` } })) } });
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

for (const width of [320, 1280]) test(`bulk grants keep selection across pages and search at ${width}px`, async ({ page, fixture, database }) => {
  await page.setViewportSize({ width, height: 900 });
  const prefix = `Lô cấp quyền ${width}`;
  const members = [];
  for (let index = 1; index <= 12; index++) members.push(await database.user.create({ data: { email: `${fixture.prefix}-grant-${width}-${index}`, fullName: `${prefix} ${String(index).padStart(2, '0')}`, role: 'MEMBER', status: 'ACTIVE' } }));
  for (const [label, data] of [['hidden', { hiddenFromDirectory: true }], ['core', { role: 'CORE_MEMBER' as const }], ['disabled', { status: 'SUSPENDED' as const }]] as const) await database.user.create({ data: { email: `${fixture.prefix}-grant-${width}-${label}`, fullName: `${prefix} ${label}`, role: 'MEMBER', status: 'ACTIVE', ...data } });
  await login(page, fixture.users[0], '/admin/members');
  await page.getByRole('button', { name: 'Cấp quyền hàng loạt', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Cấp quyền đăng bài hàng loạt', exact: true });
  const search = modal.getByRole('searchbox', { name: 'Tìm thành viên để cấp quyền' });
  await search.fill(prefix);
  await modal.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(modal.getByText('12 thành viên · Trang 1/2', { exact: true })).toBeVisible();
  for (const label of ['hidden', 'core', 'disabled']) await expect(modal.getByRole('checkbox', { name: `Chọn ${prefix} ${label}`, exact: true })).toHaveCount(0);
  await modal.getByRole('checkbox', { name: `Chọn ${members[0].fullName}`, exact: true }).check();
  await modal.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await modal.getByRole('checkbox', { name: `Chọn ${members[10].fullName}`, exact: true }).check();
  await expect(modal.getByRole('region', { name: 'Thành viên đã chọn' })).toContainText(members[0].fullName);
  await search.fill(members[11].fullName);
  await modal.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await modal.getByRole('checkbox', { name: `Chọn ${members[11].fullName}`, exact: true }).check();
  await modal.getByRole('button', { name: 'Xem lại 3 thành viên', exact: true }).click();
  await expect(modal.getByText('Xác nhận danh sách cấp quyền (3)', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await modal.getByRole('button', { name: 'Xác nhận cấp quyền (3)', exact: true }).click();
  await acknowledgeSuccess(page, 'Đã cấp quyền đăng bài cho 3 thành viên.');
  await expect(modal).toBeHidden();
  for (const index of [0, 10, 11]) expect(await database.user.findUniqueOrThrow({ where: { id: members[index].id } })).toMatchObject({ role: 'CORE_MEMBER', sessionVersion: 2 });
  expect((await database.user.findUniqueOrThrow({ where: { id: members[1].id } })).role).toBe('MEMBER');
});

test('a stale grant selection leaves the whole batch unchanged and offers reload', async ({ page, fixture, database }) => {
  const members = await Promise.all([1, 2].map(index => database.user.create({ data: { email: `${fixture.prefix}-stale-grant-${index}`, fullName: `Lô xung đột ${index}`, role: 'MEMBER', status: 'ACTIVE' } })));
  await login(page, fixture.users[0], '/admin/members');
  await page.getByRole('button', { name: 'Cấp quyền hàng loạt', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Cấp quyền đăng bài hàng loạt' });
  await modal.getByRole('searchbox').fill('Lô xung đột');
  await modal.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  for (const member of members) await modal.getByRole('checkbox', { name: `Chọn ${member.fullName}`, exact: true }).check();
  await database.user.update({ where: { id: members[0].id }, data: { sessionVersion: { increment: 1 } } });
  await modal.getByRole('button', { name: 'Xem lại 2 thành viên', exact: true }).click();
  await modal.getByRole('button', { name: 'Xác nhận cấp quyền (2)', exact: true }).click();
  await expect(modal.getByRole('alert')).toContainText('Chưa cấp quyền cho ai');
  for (const member of members) expect((await database.user.findUniqueOrThrow({ where: { id: member.id } })).role).toBe('MEMBER');
  await modal.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click();
  await expect(modal.getByRole('button', { name: 'Xem lại 0 thành viên', exact: true })).toBeDisabled();
});
