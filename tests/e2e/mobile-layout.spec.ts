import { expect, login, seedPhotoGalleries, test } from './fixtures';

test.beforeEach(async ({ database }) => { await seedPhotoGalleries(database); });
test.afterEach(async ({ database }) => { await database.homeMomentsGallery.deleteMany(); });

for (const width of [320, 375, 390, 768, 900]) {
  test(`banner and public pages fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const artElement = page.locator('.home-hero__art');
    const introElement = page.locator('.home-hero__intro');
    // Next.js can stream the page after navigation has completed.
    await expect(artElement).toBeVisible();
    await expect(introElement).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const art = await artElement.boundingBox();
    const intro = await introElement.boundingBox();
    expect(art).not.toBeNull();
    expect(intro).not.toBeNull();
    expect(art!.x).toBeGreaterThanOrEqual(0);
    expect(art!.x + art!.width).toBeLessThanOrEqual(width);
    expect(art!.y).toBeGreaterThanOrEqual(intro!.y + intro!.height);
    await expect(page.locator('.home-hero__art')).toHaveCSS('opacity', '1');
    const fadeStart = await page.locator('.home-hero').evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const fade = getComputedStyle(element, '::after');
      return bounds.bottom - parseFloat(fade.height) - parseFloat(fade.bottom);
    });
    expect(fadeStart).toBeGreaterThanOrEqual(843);
    expect(art!.y + art!.height).toBeLessThanOrEqual(844);

    await page.screenshot({ path: `test-results/home-mobile-${width}.png` });
    for (const route of ['/', '/explore', '/members', '/contact', '/login', '/projects']) {
      if (route !== '/') await page.goto(route);
      const destination = route === '/explore' ? '/research' : route;
      await expect(page).toHaveURL(url => url.pathname === destination);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const brandElement = page.locator('.site-brand');
      const accountElement = page.locator('#site-navbar').getByRole('link', { name: 'Đăng nhập', exact: true });
      await expect(brandElement).toBeVisible();
      await expect(accountElement).toBeVisible();
      const brand = await brandElement.boundingBox();
      const account = await accountElement.boundingBox();
      expect(brand!.x + brand!.width).toBeLessThanOrEqual(account!.x);
    }
    await page.screenshot({ path: `test-results/mobile-layout-${width}.png`, fullPage: true });
  });
}

test('touch phones animate the photo wall and can pause and open photos', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    const wall = page.locator('.moments-wall');
    const track = wall.locator('.moments-track').first();
    await expect(track).toHaveCSS('animation-name', 'moments-drift');
    const transform = await track.evaluate(element => getComputedStyle(element).transform);
    await expect.poll(() => track.evaluate(element => getComputedStyle(element).transform)).not.toBe(transform);
    await wall.getByRole('button', { name: 'Tạm dừng chuyển động' }).tap();
    await expect(track).toHaveCSS('animation-play-state', 'paused');
    await wall.locator('.moment-photo').first().tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng hộp thoại' }).tap();
    await wall.getByRole('button', { name: 'Tiếp tục chuyển động' }).tap();
    await expect(track).toHaveCSS('animation-play-state', 'running');
  } finally { await context.close(); }
});

test('banner adapts to landscape and the account menu fits small phones', async ({ page, fixture }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.locator('.home-hero__primary-action').scrollIntoViewIfNeeded();
  await expect(page.locator('.home-hero__primary-action')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/home-landscape.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  const menu = page.getByRole('button', { name: /^Menu tài khoản:/ });
  const brand = await page.locator('.site-brand').boundingBox();
  const account = await menu.boundingBox();
  expect(brand!.x + brand!.width).toBeLessThanOrEqual(account!.x);
  await menu.click();
  const navigation = page.getByRole('navigation', { name: 'Chức năng tài khoản' });
  await expect(navigation).toBeVisible();
  const bounds = await navigation.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
});
