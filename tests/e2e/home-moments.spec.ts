import { expect, seedPhotoGalleries, test } from './fixtures';

test.beforeEach(async ({ database }) => { await seedPhotoGalleries(database); });
test.afterEach(async ({ database }) => { await database.homeMomentsGallery.deleteMany(); });

test('photo lanes resume after closing the viewer without leaving scrollbars', async ({ page }) => {
  await page.goto('/');
  const wall = page.locator('.moments-wall');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  const photo = wall.getByRole('button', { name: 'Xem ảnh: Cùng nhau tìm lời giải', exact: true }).first();
  for (const close of ['button', 'Escape']) {
    await wall.locator('.moments-lane').first().hover();
    await photo.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if (close === 'Escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(photo).toBeFocused();
    await wall.getByRole('heading').hover();
    for (const lane of await wall.locator('.moments-lane').all()) {
      await expect(lane).toHaveCSS('overflow-x', 'hidden');
      const track = lane.locator('.moments-track');
      await expect(track).toHaveCSS('animation-name', 'moments-drift');
      await expect(track).toHaveCSS('animation-play-state', 'running');
      const initialTransform = await track.evaluate(element => getComputedStyle(element).transform);
      await expect.poll(() => track.evaluate(element => getComputedStyle(element).transform)).not.toBe(initialTransform);
    }
  }
});

test('photo wall moves, pauses and opens an accessible viewer', async ({ page }) => {
  await page.goto('/');
  const wall = page.getByRole('region', { name: 'Những khoảnh khắc cùng nhau tạo nên công nghệ.' });
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  const lane = wall.locator('.moments-lane').first();
  const track = lane.locator('.moments-track');
  await expect(track).toHaveCSS('animation-name', 'moments-drift');
  await lane.hover();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await wall.getByRole('button', { name: 'Tạm dừng chuyển động' }).click();
  await expect(wall).toHaveAttribute('data-paused', 'true');
  const photo = wall.getByRole('button', { name: 'Xem ảnh: Cùng nhau tìm lời giải', exact: true }).first();
  await photo.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Cùng nhau tìm lời giải');
  await dialog.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Bắt đầu từ những chi tiết nhỏ');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Cùng nhau tìm lời giải');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(photo).toBeFocused();
  await expect(wall).toHaveAttribute('data-paused', 'true');
  await wall.getByRole('button', { name: 'Tiếp tục chuyển động' }).click();
  await expect(wall).not.toHaveAttribute('data-paused', 'true');
  await wall.screenshot({ path: 'test-results/home-moments-desktop.png' });
});

test('photo wall supports manual browsing on mobile and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const wall = page.locator('.moments-wall');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  await expect(wall.locator('.moments-track').first()).toHaveCSS('animation-name', 'none');
  await expect(wall.locator('.moments-group[aria-hidden="true"]').first()).toBeHidden();
  const lane = wall.locator('.moments-lane').first();
  await lane.evaluate(element => { element.scrollLeft = 200; });
  expect(await lane.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const brokenImages = await wall.locator('img').evaluateAll(images => images.filter(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth === 0).length);
  expect(brokenImages).toBe(0);
  await wall.screenshot({ path: 'test-results/home-moments-mobile.png' });
});

test('keyboard browsing remains available and ends when the viewer closes', async ({ page }) => {
  await page.goto('/');
  const wall = page.locator('.moments-wall');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  await wall.getByRole('button', { name: 'Tạm dừng chuyển động' }).focus();
  await page.keyboard.press('Tab');
  await expect(wall).toHaveAttribute('data-keyboard-browsing', 'true');
  await expect(wall.locator('.moments-track').first()).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(wall).not.toHaveAttribute('data-keyboard-browsing', 'true');
  await expect(wall.locator('.moments-track').first()).toHaveCSS('animation-name', 'moments-drift');
});
