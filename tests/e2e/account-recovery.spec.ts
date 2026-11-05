import { randomBytes } from 'node:crypto';
import { expect, login, test } from './fixtures';

test('admin restores an identity and reveals a single-use temporary password for forced change', async ({ page, fixture, database, browser }) => {
  const user = await database.user.create({ data: { email: `${fixture.prefix}-recovery@example.test`, fullName: 'Thành viên khôi phục', role: 'MEMBER', status: 'SUSPENDED', deletedAt: new Date() } });
  const memberContext = await browser.newContext();
  try {
    await login(page, fixture.users[0], `/admin/members?q=${encodeURIComponent(user.fullName)}&status=DISABLED`);
    await expect(page).toHaveTitle(/^Quản lý thành viên/);
    await page.getByRole('button', { name: 'Khôi phục', exact: true }).click();
    await page.getByRole('button', { name: 'Khôi phục tài khoản', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã khôi phục tài khoản' })).toBeVisible();
    const restoreDialog = page.getByRole('dialog', { name: 'Khôi phục tài khoản', exact: true });
    if (await restoreDialog.isVisible()) await restoreDialog.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.goto(`/admin/members?q=${encodeURIComponent(user.fullName)}&status=ACTIVE`);
    const row = page.locator('.admin-member-row');
    await row.getByRole('button', { name: `Quyền của ${user.fullName}`, exact: true }).click();
    await row.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo mật khẩu tạm', exact: true }).click();
    const temporary = page.getByLabel('Mật khẩu tạm', { exact: true });
    await expect(temporary).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    await expect(temporary).toHaveAttribute('type', 'text');
    const password = await temporary.inputValue();
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Đặt lại mật khẩu', exact: true })).toHaveCount(0);
    const memberPage = await memberContext.newPage();
    await memberPage.goto('/login');
    await memberPage.locator('#identifier').fill(user.email);
    await memberPage.locator('#password').fill(password);
    await memberPage.locator('form button[type="submit"]').click();
    await expect(memberPage.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true })).toBeVisible();
    const nextPassword = `Aa1!${randomBytes(24).toString('base64url')}`;
    await memberPage.locator('input[autocomplete="current-password"]').fill(password);
    await memberPage.locator('input[autocomplete="new-password"]').nth(0).fill(nextPassword);
    await memberPage.locator('input[autocomplete="new-password"]').nth(1).fill(nextPassword);
    await memberPage.locator('form button[type="submit"]').click();
    await expect(memberPage).toHaveURL(/\/login\?passwordChanged=1$/);
    expect(await database.user.findUnique({ where: { id: user.id }, select: { sessionVersion: true, mustChangePassword: true, temporaryPasswordConsumed: true } })).toEqual({ sessionVersion: 5, mustChangePassword: false, temporaryPasswordConsumed: false });
  } finally {
    await memberContext.close();
    await database.user.delete({ where: { id: user.id } });
  }
});
