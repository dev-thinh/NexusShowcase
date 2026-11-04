import { expect, test } from './fixtures';
const research = '/category/bai-bao-khoa-hoc';

test('both homepage entry points open research after retiring the all-publications page', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByRole('link', { name: 'Khám phá công trình', exact: true });
  await expect(hero).toHaveAttribute('href', research);
  await hero.click();
  await expect(page).toHaveURL(new RegExp(`${research}$`));
  await expect(page.locator('main article')).toHaveCount(10);
  await page.goBack();
  await page.getByRole('link', { name: 'Xem nghiên cứu khoa học', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${research}$`));
});

test('research search and reset stay within the category', async ({ page }) => {
  await page.goto(research);
  await page.getByRole('searchbox', { name: 'Từ khóa tìm kiếm' }).fill('library-no-matching-results');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page).toHaveURL(/\/category\/bai-bao-khoa-hoc\?q=library-no-matching-results/);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy công trình phù hợp' })).toBeVisible();
  await page.getByRole('link', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${research}$`));
  await expect(page.locator('main article')).toHaveCount(10);
});

for (const source of ['/explore?q=Benchmark&year=2026&sort=title&page=2', '/?q=Benchmark&page=2']) {
  test(`legacy URL redirects to research with parameters intact: ${source}`, async ({ page }) => {
    await page.goto(source);
    await expect(page).toHaveURL(/\/category\/bai-bao-khoa-hoc\?/);
    const current = new URL(page.url());
    for (const [key, value] of new URL(source, 'https://test.local').searchParams) expect(current.searchParams.get(key)).toBe(value);
    await expect(page.getByRole('navigation', { name: 'Chuyên mục công trình', exact: true })).toHaveCount(0);
  });
}
