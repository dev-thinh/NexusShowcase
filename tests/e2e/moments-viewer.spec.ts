import { expect, test } from '@playwright/test';
import { defaultMoments, fixtureImage } from '../fixtures/moments';

const photos = defaultMoments.slice(0, 2);

test('opens a thumbnail immediately, loads an optimized enlargement, and handles a failed next image', async ({ page }) => {
  let releaseImage!: () => void;
  const pending = new Promise<void>(resolve => { releaseImage = resolve; });
  let failNext = true;
  await page.route('**/api/home/moments', route => route.fulfill({ json: { version: 0, isAdmin: false, photos } }));
  await page.route('**/uploads/thumbnails/fixture-*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('w') === '1080') {
      if (url.pathname === photos[0].src) await pending;
      if (url.pathname === photos[1].src && failNext) return route.fulfill({ status: 503, body: 'Unavailable' });
    }
    return route.fulfill({ contentType: 'image/png', body: fixtureImage });
  });
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"][data-state="ready"]').waitFor();
  const photo = page.getByRole('button', { name: `Xem ảnh: ${photos[0].title}`, exact: true });
  await photo.click();
  const dialog = page.getByRole('dialog', { name: photos[0].title, exact: true });
  try {
    await expect.poll(() => dialog.evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
    await expect(dialog.getByRole('status')).toHaveText('Đang tải ảnh rõ nét');
    await expect(dialog.locator('.moments-viewer__preview')).toBeVisible();
    await expect(dialog.locator('.moments-viewer__stage')).toHaveAttribute('data-loading', 'true');
    expect(await dialog.locator('.moments-viewer__stage').evaluate(element => element.getAnimations().length)).toBe(0);
  } finally { releaseImage(); }
  await expect(dialog.locator('.moments-viewer__stage')).toHaveAttribute('data-loading', 'false');
  await expect(dialog.locator('.moments-viewer__image')).toHaveAttribute('src', `${photos[0].src}?w=1080`);
  await expect(dialog.getByRole('status')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Không tải được ảnh rõ nét');
  failNext = false;
  await page.getByRole('button', { name: 'Tải lại ảnh' }).click();
  await expect(page.locator('.moments-viewer__stage')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('dialog', { name: photos[0].title, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(photo).toBeFocused();
});

test('respects reduced motion when opening a photo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/home/moments', route => route.fulfill({ json: { version: 0, isAdmin: false, photos } }));
  await page.route('**/uploads/thumbnails/fixture-*', route => route.fulfill({ contentType: 'image/png', body: fixtureImage }));
  await page.goto('/');
  await page.getByRole('button', { name: `Xem ảnh: ${photos[0].title}`, exact: true }).click();
  const stage = page.locator('.moments-viewer__stage');
  await expect(stage).toBeVisible();
  expect(await stage.evaluate(element => element.getAnimations().length)).toBe(0);
  expect(await page.getByRole('dialog').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
