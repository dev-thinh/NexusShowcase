import { expect, test } from './fixtures';

test('both homepage entry points open the full library without a search term', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#home-search')).toHaveCount(0);
  const hero = page.getByRole('link', { name: 'Khám phá công trình', exact: true });
  await expect(hero).toHaveAttribute('href', '/explore');
  await hero.click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole('heading', { name: 'Khám phá các bài nghiên cứu và dự án của CLB Robotics & IoT.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tất cả công trình · 20 công trình' })).toBeVisible();
  await expect(page.locator('main article')).toHaveCount(10);
  await page.goBack();
  await page.getByRole('link', { name: 'Xem tất cả công trình', exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole('heading', { name: 'Khám phá các bài nghiên cứu và dự án của CLB Robotics & IoT.', exact: true })).toBeVisible();
});

test('search and reset keep the library title and destination', async ({ page }) => {
  await page.goto('/explore');
  await page.getByRole('searchbox', { name: 'Từ khóa tìm kiếm' }).fill('library-no-matching-results');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page).toHaveURL(/\/explore\?q=library-no-matching-results/);
  await expect(page.getByRole('heading', { name: 'Khám phá các bài nghiên cứu và dự án của CLB Robotics & IoT.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Không tìm thấy công trình phù hợp' })).toBeVisible();
  await page.getByRole('link', { name: 'Xóa bộ lọc', exact: true }).first().click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole('heading', { name: 'Tất cả công trình · 20 công trình' })).toBeVisible();
});

test('legacy search links redirect with query and page intact', async ({ page }) => {
  await page.goto('/?q=Benchmark&page=2');
  await expect(page).toHaveURL(/\/explore\?q=Benchmark&page=2$/);
  await expect(page.getByRole('heading', { name: 'Khám phá các bài nghiên cứu và dự án của CLB Robotics & IoT.', exact: true })).toBeVisible();
  await expect(page.locator('main article')).toHaveCount(10);
});

test('library pagination completes without leaving the loading screen', async ({ page }) => {
  await page.goto('/explore');
  await page.getByRole('navigation', { name: 'Phân trang kho công trình' }).getByRole('link', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/\/explore\?page=2$/);
  await expect(page.getByRole('heading', { name: 'Tất cả công trình · 20 công trình' })).toBeVisible();
  await expect(page.locator('main article')).toHaveCount(10);
  await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
});

test('section tabs connect all publications, research and robotics', async ({ page }) => {
  await page.goto('/explore');
  const tabs = page.getByRole('navigation', { name: 'Chuyên mục công trình', exact: true });
  for (const [label, href] of [
    ['Nghiên cứu khoa học', '/category/bai-bao-khoa-hoc'],
    ['Robotics & IoT', '/category/robotics-iot'],
    ['Tất cả công trình', '/explore'],
  ]) {
    await tabs.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(tabs.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
  }
});
