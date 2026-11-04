import { expect, login, test } from './fixtures';

for (const width of [390, 1440]) {
  test(`public pages use the same breadcrumb at ${width}px`, async ({ page, fixture }) => {
    await page.setViewportSize({ width, height: 900 });
    let reference: unknown;
    for (const route of ['/explore', '/research', '/projects', '/members', '/members/all', `/members/${fixture.users[1].id}`, '/works/benchmark-0', '/contact']) {
      await page.goto(route);
      const breadcrumb = page.getByRole('navigation', { name: 'Đường dẫn', exact: true });
      await expect(breadcrumb).toHaveCount(1);
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(breadcrumb.getByRole('link', { name: 'Trang chủ', exact: true })).toHaveAttribute('href', '/');
      const styles = await breadcrumb.evaluate(element => {
        const css = getComputedStyle(element);
        return { fontSize: css.fontSize, lineHeight: css.lineHeight, color: css.color, marginBottom: css.marginBottom };
      });
      reference ??= styles;
      expect(styles).toEqual(reference);
      expect(await breadcrumb.evaluate(element => element.getBoundingClientRect().right <= innerWidth)).toBe(true);
      if (route.startsWith('/category/') || route === '/explore') await expect(breadcrumb.locator('li')).toHaveCount(2);
    }
  });
}

test('account and administration pages use the shared hierarchy', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin');
  for (const route of ['/admin', '/admin/members', '/admin/reviews', '/my-works', '/my-works/new', '/account/change-password']) {
    await page.goto(route);
    const breadcrumb = page.locator('[data-breadcrumbs]');
    await expect(breadcrumb).toHaveCount(1);
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCount(1);
  }
});

test('detail breadcrumb preserves library filters and pagination', async ({ page }) => {
  const source = '/research?q=Benchmark&page=2';
  await page.goto(`/works/benchmark-0?returnTo=${encodeURIComponent(source)}`);
  const parent = page.locator('[data-breadcrumbs]').getByRole('link', { name: 'Nghiên cứu khoa học', exact: true });
  await expect(parent).toHaveAttribute('href', source);
  await parent.click();
  await expect(page).toHaveURL(/\/research\?q=Benchmark&page=2$/);
});

for (const width of [390, 1440]) {
  test(`login uses direct home navigation without a breadcrumb at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    await expect(page.getByRole('navigation', { name: 'Đường dẫn', exact: true })).toHaveCount(0);
    const home = page.getByRole('main').getByRole('link', { name: 'Trang chủ', exact: true });
    await expect(home).toBeVisible();
    await expect(home).toHaveAttribute('href', '/');
    await home.click();
    await expect(page).toHaveURL(/\/$/);
  });
}
