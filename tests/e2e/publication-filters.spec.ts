import { expect, test } from './fixtures';

for (const path of ['/explore', '/category/robotics-iot']) {
  test(`mobile filters expand and preserve submitted values on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(path);
    const form = page.getByRole('search', { name: 'Tìm kiếm và lọc công trình' });
    const toggle = form.getByRole('button', { name: /Bộ lọc/ });
    await expect(form.getByRole('searchbox')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(form.getByLabel('Năm thực hiện')).toBeHidden();
    expect((await form.boundingBox())!.height).toBeLessThan(180);
    await toggle.click();
    await form.getByLabel('Năm thực hiện').fill('2025');
    await expect(form.getByRole('combobox')).toBeVisible();
    await toggle.click();
    await form.getByRole('button', { name: 'Áp dụng', exact: true }).click();
    await expect(page).toHaveURL(/year=2025/);
    await form.getByRole('button', { name: /Bộ lọc/ }).click();
    await expect(form.getByLabel('Năm thực hiện')).toHaveValue('2025');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await form.getByRole('link', { name: 'Xóa bộ lọc' }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
  });
}

test('desktop filters remain directly available', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/explore');
  const form = page.getByRole('search');
  await expect(form.getByLabel('Năm thực hiện')).toBeVisible();
  await expect(form.getByRole('combobox')).toBeVisible();
  await expect(form.getByRole('button', { name: /Bộ lọc/ })).toBeHidden();
});
