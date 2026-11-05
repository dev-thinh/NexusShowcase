import { expect, openPublicNavigation, test } from './fixtures';

for (const width of [320, 390, 1440]) {
  test(`publication tabs are removed and contact details are updated at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/research', '/projects']) {
      await page.goto(path);
      await expect(page.getByRole('search')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Chuyên mục công trình', exact: true })).toHaveCount(0);
      await expect(page.locator('a[href="/explore"]')).toHaveCount(0);
      await expect(page.locator('footer').getByText('Hỗ trợ trích dẫn BibTeX, APA và IEEE', { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await openPublicNavigation(page);
    const menu = page.getByRole('navigation', { name: 'Điều hướng chính', exact: true });
    await expect(menu.getByRole('link', { name: 'Nghiên cứu khoa học', exact: true })).toHaveAttribute('href', '/research');
    await expect(menu.getByRole('link', { name: 'Dự án & Sản phẩm', exact: true })).toHaveAttribute('href', '/projects');
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'CLB Robotics - IoT, Trường Đại học Khoa học tự nhiên, ĐHQG-HCM', exact: true })).toBeVisible();
    await expect(page.getByText('Phòng i86, Tòa nhà i, 227 Nguyễn Văn Cừ, Phường Chợ Quán, TP.HCM', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'robotics@hcmus.edu.vn', exact: true })).toHaveAttribute('href', 'mailto:robotics@hcmus.edu.vn');
    await expect(page.getByRole('link', { name: 'Zalo: 0366 399 748', exact: true })).toHaveAttribute('href', 'https://zalo.me/0366399748');
    await expect(page.getByText('Phòng thí nghiệm Trí tuệ Nhân tạo (AILab), trường Đại học Khoa học tự nhiên, ĐHQG-HCM', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'hcmus.edu.vn', exact: true })).toHaveAttribute('href', 'https://hcmus.edu.vn');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
