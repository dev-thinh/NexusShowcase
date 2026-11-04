import { expect, test } from './fixtures';

for (const width of [320, 390]) {
  test(`mobile login prioritizes the form without repeated branding at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/login?callbackUrl=%2Fmy-works');
    const main = page.getByRole('main');
    await expect(main.locator('[data-brand-lockup="login"]')).toBeHidden();
    await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
    const title = main.getByRole('heading', { name: 'Đăng nhập', exact: true });
    await expect(title).toBeVisible();
    await expect(main.getByLabel('Tài khoản hoặc Email', { exact: true })).toBeVisible();
    const headerBottom = await page.locator('#site-navbar').evaluate(element => element.getBoundingClientRect().bottom);
    const formTop = await main.locator('.panel-detail').evaluate(element => element.getBoundingClientRect().top);
    expect(formTop - headerBottom).toBeGreaterThanOrEqual(16);
    expect(formTop - headerBottom).toBeLessThanOrEqual(40);
    await expect(main.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeInViewport();
    await main.getByLabel('Tài khoản hoặc Email', { exact: true }).fill('member@example.test');
    await main.getByLabel('Mật khẩu', { exact: true }).fill('Example-password1!');
    await main.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    await expect(main.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'text');
    await expect(main.getByLabel('Mật khẩu', { exact: true })).toHaveValue('Example-password1!');
    const shortcuts = main.getByRole('navigation', { name: 'Điều hướng đăng nhập', exact: true });
    await expect(shortcuts.getByRole('link', { name: 'Trang chủ', exact: true })).toHaveAttribute('href', '/');
    await expect(shortcuts.getByRole('link', { name: 'Liên hệ', exact: true })).toHaveAttribute('href', '/contact');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('desktop login keeps its introduction alongside the form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login');
  await expect(page.locator('[data-brand-lockup="login"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Cùng nghiên cứu\.\s*Cùng sáng tạo\./ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  const layout = await page.getByRole('main').evaluate(element => {
    const intro = element.querySelector('aside')!.getBoundingClientRect();
    const form = element.querySelector('.panel-detail')!.getBoundingClientRect();
    return { introRight: intro.right, formLeft: form.left };
  });
  expect(layout.formLeft).toBeGreaterThan(layout.introRight);
});
