import { expect, test } from './fixtures';

for (const width of [320, 390, 768, 900, 1024, 1100, 1279]) {
  test(`mobile header uses one row and a readable disclosure menu at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const header = page.locator('#site-navbar');
    const toggle = header.locator('.site-mobile-menu-toggle');
    const navigation = header.getByRole('navigation', { name: 'Điều hướng chính', exact: true });
    const account = header.getByRole('link', { name: 'Đăng nhập', exact: true });
    await expect(toggle).toBeVisible();
    await expect(account).toBeVisible();
    await expect(header).toHaveAttribute('data-banner-top', 'true');
    await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(navigation).toBeHidden();
    const bounds = await header.boundingBox();
    expect(bounds!.height).toBeLessThan(92);
    const centers = await header.locator('.site-brand, .site-mobile-menu-toggle, .site-account-navigation > a').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return box.top + box.height / 2;
    }));
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
    const heroHeight = await page.locator('.home-hero').evaluate(element => element.getBoundingClientRect().height);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation).toBeVisible();
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(navigation.getByRole('link')).toHaveCount(5);
    await expect(navigation.getByRole('link', { name: 'Trang chủ', exact: true })).toHaveAttribute('aria-current', 'page');
    const menu = await navigation.boundingBox();
    expect(menu!.x).toBeGreaterThanOrEqual(0);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
    expect(await navigation.getByRole('link').evaluateAll(links => links.every(link => link.getBoundingClientRect().height >= 44))).toBe(true);
    expect(await page.locator('.home-hero').evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(heroHeight, 0);
    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.keyboard.press('Enter');
    await expect(navigation).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(navigation.getByRole('link').first()).toBeFocused();
    await navigation.getByRole('link', { name: 'Liên hệ', exact: true }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(navigation).toBeHidden();
    await header.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click();
    await expect(navigation.getByRole('link', { name: 'Liên hệ', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.mouse.click(2, 820);
    await expect(navigation).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [1280, 1440]) test(`desktop retains one row of visible navigation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.locator('.site-mobile-menu-toggle')).toBeHidden();
  const navigation = page.getByRole('navigation', { name: 'Điều hướng chính', exact: true });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link')).toHaveCount(5);
  const positions = await navigation.getByRole('link').evaluateAll(links => links.map(link => link.getBoundingClientRect().y));
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
  expect((await page.locator('#site-navbar').boundingBox())!.height).toBeLessThan(80);
  await navigation.getByRole('link', { name: 'Liên hệ', exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
});
