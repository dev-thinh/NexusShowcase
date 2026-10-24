import { randomBytes } from 'node:crypto';
import { expect, login, test } from './fixtures';

test('forced password change signs out and requires the new password', async ({ page, fixture, database }) => {
  const user = fixture.users[2];
  const newPassword = randomBytes(24).toString('base64url');
  await login(page, user);
  await expect(page).toHaveURL(/\/account\/change-password$/);
  await page.locator('input[autocomplete="current-password"]').fill(user.password);
  await page.locator('input[autocomplete="new-password"]').nth(0).fill(newPassword);
  await page.locator('input[autocomplete="new-password"]').nth(1).fill(newPassword);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  expect(await database.user.findUnique({ where: { id: user.id }, select: { mustChangePassword: true, sessionVersion: true } })).toEqual({ mustChangePassword: false, sessionVersion: 2 });
  await login(page, { ...user, password: newPassword });
  await expect(page).toHaveURL(/\/dashboard$/);
});
