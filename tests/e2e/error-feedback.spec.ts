import { expect, login, test } from './fixtures';

for (const width of [390, 1440]) test(`wrong credentials show a prominent red warning at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/login');
  await page.locator('#identifier').fill(fixture.users[1].email);
  await page.locator('#password').fill('definitely-incorrect-password');
  await page.locator('form button[type="submit"]').click();
  const alert = page.getByRole('alert').filter({ hasText: /không chính xác/ });
  await expect(alert).toBeVisible();
  await expect(alert).toHaveCSS('color', 'rgb(185, 28, 28)');
  await expect(alert).toHaveCSS('background-color', 'rgb(254, 242, 242)');
  await expect(alert.locator('svg')).toHaveCSS('color', 'rgb(185, 28, 28)');
  await expect(alert).toBeFocused();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#password')).toHaveCSS('border-top-color', 'rgb(185, 28, 28)');
  await page.locator('#password').fill('editing-another-password');
  await expect(alert).toHaveCount(0);
});

test('missing login fields and a wrong current password use the same red error color', async ({ page, fixture }) => {
  await page.goto('/login');
  await page.locator('form button[type="submit"]').click();
  const fields = page.locator('form').getByRole('alert');
  await expect(fields).toHaveCount(2);
  for (const alert of await fields.all()) await expect(alert).toHaveCSS('color', 'rgb(185, 28, 28)');
  await login(page, fixture.users[3], '/account/change-password');
  const dialog = page.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.locator('input[autocomplete="current-password"]').fill('incorrect-current-password');
  await dialog.locator('input[autocomplete="new-password"]').nth(0).fill('Private-new-password-for-test-2026!');
  await dialog.locator('input[autocomplete="new-password"]').nth(1).fill('Private-new-password-for-test-2026!');
  await dialog.locator('form button[type="submit"]').click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveCSS('color', 'rgb(185, 28, 28)');
  await expect(dialog.getByRole('alert')).toHaveCSS('background-color', 'rgb(254, 242, 242)');
});
