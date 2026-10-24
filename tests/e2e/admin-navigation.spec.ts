import { expect, login, test } from './fixtures';

for (const width of [390, 1024, 1440]) test(`home account menu opens administration pages at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 900 });
  await login(page, fixture.users[0], '/');
  for (const [label, route, title] of [
    ['Admin Dashboard', '/admin', 'Tổng quan quản trị'],
    ['Phê duyệt', '/admin/reviews', 'Phê duyệt bài đăng'],
    ['Quản lý thành viên', '/admin/members', 'Quản lý thành viên'],
    ['Bài đăng của tôi', '/dashboard', 'Bài đăng của tôi'],
  ]) {
    if (new URL(page.url()).pathname !== '/') {
      await page.locator('#site-navbar nav a[href="/"]').first().click();
      await expect(page.locator('#home-content')).toBeVisible();
    }
    await page.getByRole('button', { name: /Menu tài khoản/ }).click();
    await page.getByRole('navigation', { name: 'Chức năng tài khoản' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
    await expect(page.locator('#profile-navigation')).toBeHidden();
  }
  for (const [label, route] of [
    ['Tổng quan', '/admin'],
    ['Thành viên', '/admin/members'],
    ['Phê duyệt', '/admin/reviews'],
  ]) {
    await page.getByRole('navigation', { name: 'Điều hướng quản lý' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
  }
});

test('review queue has only the shared slash breadcrumb', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/reviews');
  await expect(page.locator('[data-breadcrumbs]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Bàn làm việc quản trị/ })).toHaveCount(0);
});

test('account navigation keeps feedback until a delayed destination arrives', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/');
  let release!: () => void;
  const response = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/admin?*', async route => {
    if (route.request().headers().rsc === '1') await response;
    await route.continue();
  });
  await page.getByRole('button', { name: /Menu tài khoản/ }).click();
  await page.getByRole('link', { name: 'Admin Dashboard', exact: true }).click();
  try {
    await expect(page.locator('[data-destination-loading="/admin"]')).toBeVisible();
    await expect(page.locator('#home-content')).toBeHidden();
    await expect(page.locator('#profile-navigation')).toBeHidden();
  } finally { release(); }
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Tổng quan quản trị', exact: true })).toBeVisible();
});
