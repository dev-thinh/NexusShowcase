import bcrypt from 'bcryptjs';
import { auditControls } from './controls-layout';
import { readFile } from 'node:fs/promises';
import { expect, login, test } from './fixtures';

for (const width of [320, 1280]) test(`compact bulk reset, selected-member disclosure and pagination work at ${width}px`, async ({ page, fixture, database }) => {
  const prefix = `Bulk reset ${width}`;
  const members = [];
  for (let index = 0; index < 12; index++) members.push(await database.user.create({ data: { fullName: `${prefix} ${String(index).padStart(2, '0')}`, email: `bulk-reset-${width}-${index}@test.invalid`, role: 'MEMBER', status: 'ACTIVE' } }));
  try {
    await page.setViewportSize({ width, height: 900 });
    await login(page, fixture.users[0], '/admin/members');
    await page.getByRole('button', { name: 'Quản lý hàng loạt', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Quản lý tài khoản hàng loạt', exact: true });
    await modal.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
    await modal.getByRole('searchbox').fill(prefix);
    await modal.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
    await expect(modal.getByText('12 thành viên · Trang 1/2', { exact: true })).toBeVisible();
    const previous = modal.getByRole('button', { name: 'Trang trước', exact: true });
    const next = modal.getByRole('button', { name: 'Trang sau', exact: true });
    await expect(previous).toBeDisabled();
    await expect(previous).toHaveCSS('background-color', 'rgb(241, 245, 249)');
    await expect(next).toBeEnabled();
    await modal.getByRole('checkbox', { name: `Chọn ${members[0].fullName}`, exact: true }).check();
    const disclosure = modal.getByRole('button', { name: 'Xem 1 thành viên đã chọn', exact: true });
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await expect(modal.getByRole('region', { name: 'Thành viên đã chọn', exact: true })).toHaveCount(0);
    await modal.screenshot({ path: `/tmp/nexus-bulk-compact-${width}.png` });
    await disclosure.click();
    await expect(modal.getByRole('region', { name: 'Thành viên đã chọn', exact: true })).toBeVisible();
    await disclosure.click();
    await modal.getByLabel('Trang cần đến', { exact: true }).fill('2');
    await modal.getByLabel('Trang cần đến', { exact: true }).press('Enter');
    await expect(modal.getByText('12 thành viên · Trang 2/2', { exact: true })).toBeVisible();
    await expect(previous).toBeEnabled();
    await expect(next).toBeDisabled();
    await expect(next).toHaveCSS('background-color', 'rgb(241, 245, 249)');
    await modal.getByRole('checkbox', { name: `Chọn ${members[10].fullName}`, exact: true }).check();
    await modal.getByRole('button', { name: 'Xem lại 2 thành viên', exact: true }).click();
    let release = () => {};
    let responseReceived = false;
    const heldResponse = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/admin/members', async route => {
      const response = await route.fetch();
      responseReceived = true;
      await heldResponse;
      await route.fulfill({ response });
    }, { times: 1 });
    await modal.getByRole('button', { name: 'Xác nhận (2)', exact: true }).click();
    try {
      await expect.poll(() => responseReceived).toBe(true);
      await page.evaluate(() => history.back());
      await expect(modal.getByRole('alert')).toContainText('Đang đặt lại mật khẩu');
      await expect(modal).toBeVisible();
    } finally { release(); }
    await expect(modal.getByRole('region', { name: 'Kết quả đặt lại mật khẩu', exact: true })).toBeVisible();
    await auditControls(page, `password results at ${width}px`);
    for (const index of [0, 10]) {
      const field = modal.getByLabel(`Mật khẩu tạm của ${members[index].fullName}`, { exact: true });
      await expect(field).toHaveAttribute('type', 'password');
      const saved = await database.user.findUniqueOrThrow({ where: { id: members[index].id } });
      expect(saved).toMatchObject({ sessionVersion: 2, mustChangePassword: true, temporaryPasswordConsumed: false });
      expect(await bcrypt.compare(await field.inputValue(), saved.passwordHash!)).toBe(true);
    }
    await modal.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(modal.getByRole('alert')).toContainText('Chưa tải mật khẩu tạm');
    await modal.getByRole('button', { name: 'Quay lại', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await modal.getByRole('button', { name: 'Tải kết quả và mật khẩu tạm', exact: true }).click();
    const download = await downloadPromise;
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain(members[0].email);
    expect(csv).toContain(members[10].email);
    expect(csv).not.toContain(members[1].email);
    await modal.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(modal).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await database.user.deleteMany({ where: { id: { in: members.map(member => member.id) } } }); }
});
