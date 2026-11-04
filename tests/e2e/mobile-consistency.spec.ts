import type { Page } from '@playwright/test';
import { expect, login, test } from './fixtures';

async function expectPageToFit(page: Page, path: string, destination = path) {
  await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === destination);
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.getByRole('status', { name: /Đang tải/ })).toHaveCount(0);
  await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('main *')].filter(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.right > innerWidth + 1;
    }).slice(0, 8).map(element => ({ tag: element.tagName, classes: element.className })),
  }));
  expect(layout.scrollWidth, `${path}: ${JSON.stringify(layout.overflowing)}`).toBeLessThanOrEqual(layout.width);
}

for (const width of [320, 390, 768, 1440]) {
  test(`public and account layouts fit at ${width}px`, async ({ page, fixture, database }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED' } });
    for (const path of ['/explore', '/category/bai-bao-khoa-hoc', '/category/robotics-iot', '/members', '/contact', '/login', `/showcase/${item.slug}`]) {
      await page.goto(path);
      await expectPageToFit(page, path);
    }
    await login(page, fixture.users[0], '/admin');
    for (const path of ['/admin', '/admin/members', '/admin/content', '/admin/reviews', '/dashboard', `/members/${fixture.users[0].id}`, '/account/change-password', '/dashboard/items/new']) {
      await page.goto(path);
      const destination = path === '/account/change-password' ? `/members/${fixture.users[0].id}?password=change` : path;
      await expectPageToFit(page, path, destination);
      if (width === 320) await page.screenshot({ path: `/tmp/nexus-mobile-audit/${path.replaceAll('/', '-')}.png`, fullPage: true });
    }
  });
}

test('small phone editor has readable fields and actions', async ({ page, fixture }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[1], '/dashboard/items/new');
  const category = page.getByRole('combobox', { name: 'Chuyên mục', exact: true });
  await expect(category).toBeVisible();
  expect((await category.boundingBox())!.width).toBeGreaterThan(200);
  const title = page.locator('#submission-title');
  await expect(title).toHaveCSS('font-size', '16px');
  const bar = page.locator('[data-submission-actions]');
  await bar.scrollIntoViewIfNeeded();
  const positions: number[] = [];
  for (const name of ['Xem trước', 'Lưu bản nháp', 'Gửi duyệt']) {
    const button = bar.getByRole('button', { name, exact: true });
    await expect(button).toBeInViewport();
    const bounds = (await button.boundingBox())!;
    positions.push(bounds.y);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2);
});

test('small phone pagination stays on one row and dashboard uses shared filters', async ({ page, fixture }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/admin/members');
  const nav = page.getByRole('navigation', { name: 'Phân trang thành viên' });
  const before = nav.locator('[aria-disabled="true"]').first();
  const next = nav.getByRole('link', { name: 'Trang sau', exact: true });
  expect(Math.abs((await before.boundingBox())!.y - (await next.boundingBox())!.y)).toBeLessThan(2);
  expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await next.click();
  await expect(page).toHaveURL(/page=2/);
  await page.goto('/dashboard');
  const form = page.getByRole('search', { name: 'Tìm kiếm và lọc' });
  const toggle = form.getByRole('button', { name: /Bộ lọc/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(form.getByRole('group', { name: 'Lọc trạng thái bài đăng' })).toBeVisible();
});

test('phone dialogs and review details keep controls reachable', async ({ page, fixture, database }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/admin/members');
  await page.getByRole('button', { name: 'Thêm thành viên', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(dialog.getByRole('textbox').first()).toHaveCSS('font-size', '16px');
  const close = dialog.getByRole('button', { name: 'Đóng hộp thoại' });
  expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await close.click();
  await page.goto(`/members/${fixture.users[0].id}`);
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Thêm liên kết', exact: true }).click();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await dialog.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  const pending = await database.showcaseItem.create({ data: {
    creatorId: fixture.users[1].id, title: 'Công trình thử nghiệm giao diện phê duyệt trên điện thoại',
    slug: 'mobile-review-layout', summary: 'Nội dung kiểm tra bố cục trên điện thoại.', status: 'PENDING_REVIEW', publishedYear: 2026,
  } });
  try {
    await page.goto(`/admin/reviews/${pending.id}`);
    await expect(page.getByRole('heading', { name: 'Quyết định phê duyệt' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Yêu cầu chỉnh sửa', exact: true }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(dialog.getByRole('textbox')).toHaveCSS('font-size', '16px');
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  } finally { await database.showcaseItem.delete({ where: { id: pending.id } }); }
});
