import { expect, test } from './fixtures';

for (const width of [320, 390, 600]) {
  test(`publication categories fit three equal touch targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/explore');
    const tabs = page.getByRole('navigation', { name: 'Chuyên mục công trình', exact: true });
    await expect(tabs).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const sizes = await tabs.getByRole('link').evaluateAll(links => links.map(link => {
      const bounds = link.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    }));
    expect(sizes).toHaveLength(3);
    expect(Math.max(...sizes.map(size => size.width)) - Math.min(...sizes.map(size => size.width))).toBeLessThan(1);
    expect(sizes.every(size => size.height >= 44)).toBe(true);
    expect(await tabs.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const [name, href] of [
      ['Nghiên cứu khoa học', '/category/bai-bao-khoa-hoc'],
      ['Dự án & Sản phẩm', '/category/robotics-iot'],
      ['Tất cả công trình', '/explore'],
    ]) {
      const link = tabs.getByRole('link', { name, exact: true });
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(link).toHaveCSS('background-color', 'rgb(21, 61, 103)');
      await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
