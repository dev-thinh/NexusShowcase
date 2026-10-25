import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { acknowledgeSuccess, expect, login, seedPhotoGalleries, test } from './fixtures';
import { defaultMoments, fixtureUpload } from '../fixtures/moments';

test('admin uses modal slots and a reusable library without repeating photos between rows', async ({ page, fixture, database, browser }) => {
  test.setTimeout(90_000);
  let uploaded: string | undefined;
  await seedPhotoGalleries(database);
  try {
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    const pencil = page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc' });
    await pencil.click();
    const modal = page.getByRole('dialog', { name: 'Chỉnh sửa khoảnh khắc' });
    await expect(modal).toBeVisible();
    await expect(modal.getByLabel('Chủ đề', { exact: true })).toHaveCount(0);
    await expect(modal.getByLabel('Mô tả ảnh', { exact: true })).toHaveCount(0);
    await expect(modal.locator('.moments-editor__slot')).toHaveCount(12);
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toHaveCount(1);
    await expect(page.locator('.moments-wall')).toHaveAttribute('data-paused', 'true');
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Bản nháp bị hủy');
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(modal).toHaveCount(0);
    expect((await (await page.request.get('/api/home/moments')).json()).photos[0].title).toBe(defaultMoments[0].title);

    await pencil.click();
    await expect(modal).toBeVisible();
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Khoảnh khắc đã cập nhật');
    await modal.getByRole('button', { name: 'Gỡ ảnh', exact: true }).click();
    await modal.getByRole('button', { name: 'Hàng dưới, ô 1: Trống', exact: true }).click();
    await modal.getByRole('button', { name: 'Chọn ảnh: Khoảnh khắc đã cập nhật', exact: true }).click();
    await expect(modal.getByRole('button', { name: 'Hàng trên, ô 1: Trống', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Hàng dưới, ô 1: Khoảnh khắc đã cập nhật', exact: true })).toBeVisible();
    // Clicking a used library asset selects its existing slot instead of duplicating it.
    await modal.getByRole('button', { name: 'Hàng trên, ô 1: Trống', exact: true }).click();
    await modal.getByRole('button', { name: 'Chọn ảnh: Khoảnh khắc đã cập nhật', exact: true }).click();
    await expect(modal.getByRole('button', { name: 'Hàng dưới, ô 1: Khoảnh khắc đã cập nhật', exact: true })).toHaveAttribute('aria-pressed', 'true');

    const [upload] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/api/upload') && response.request().method() === 'POST'),
      modal.getByLabel('Tải ảnh mới vào thư viện').setInputFiles(fixtureUpload),
    ]);
    expect(upload.ok()).toBe(true);
    uploaded = (await upload.json()).url;
    await acknowledgeSuccess(page, 'Đã tải 1 ảnh vào thư viện chỉnh sửa.');
    expect((await page.request.get(uploaded!)).ok()).toBe(true);
    await expect(modal.locator('.moments-editor__asset')).toHaveCount(7);
    await modal.getByRole('combobox', { name: 'Lọc thư viện ảnh' }).click();
    await page.getByRole('option', { name: 'Chưa sử dụng', exact: true }).click();
    await expect(modal.locator('.moments-editor__asset')).toHaveCount(1);
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await acknowledgeSuccess(page, 'Đã lưu ảnh khoảnh khắc.');
    await expect(modal).toHaveCount(0);
    await expect(page.locator('.moments-lane[data-row="0"]')).toHaveAttribute('data-motion', 'true');
    await expect(page.locator('.moments-lane[data-row="1"] .moments-track')).toHaveCSS('animation-name', 'none');
    const saved = await database.homeMomentsGallery.findUniqueOrThrow({ where: { id: 'home' } });
    expect(saved.version).toBe(1);
    const guest = await browser.newContext();
    try {
      const publicGallery = await (await guest.request.get(`${new URL(page.url()).origin}/api/home/moments`)).json();
      expect(publicGallery.photos).toHaveLength(6);
      expect(publicGallery.photos.some((photo: { src: string }) => photo.src === uploaded)).toBe(false);
      expect(publicGallery.photos.filter((photo: { slot: number }) => photo.slot >= 6)).toHaveLength(1);
    } finally { await guest.close(); }
    expect((await page.request.put('/api/home/moments', { headers: { Origin: new URL(page.url()).origin }, data: { version: 0, photos: [] } })).status()).toBe(409);

    await page.reload();
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    await pencil.click();
    await expect(modal.locator('.moments-editor__asset')).toHaveCount(7);
    await modal.getByRole('button', { name: 'Hàng trên, ô 1: Trống', exact: true }).click();
    await modal.getByRole('button', { name: 'Chọn ảnh: collaboration', exact: true }).click();
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Ảnh mới được tái sử dụng');
    const preview = modal.getByRole('figure', { name: 'Xem trước ảnh', exact: true });
    const shape = modal.getByRole('combobox', { name: 'Khung ảnh', exact: true });
    await expect(preview.locator('figcaption')).toHaveText('Ảnh mới được tái sử dụng');
    await expect(preview.getByRole('img')).toHaveAttribute('alt', 'Ảnh mới được tái sử dụng');
    for (const value of ['wide', 'portrait', 'square']) {
      await shape.click();
      await page.getByRole('option', { name: ({ wide: 'Ngang', portrait: 'Dọc', square: 'Vuông' } as Record<string, string>)[value], exact: true }).click();
      await expect(preview).toHaveAttribute('data-preview-shape', value);
      const box = (await preview.boundingBox())!;
      if (value === 'wide') expect(box.width).toBeGreaterThan(box.height);
      else if (value === 'portrait') expect(box.height).toBeGreaterThan(box.width);
      else expect(Math.abs(box.width - box.height)).toBeLessThan(1);
    }
    await modal.screenshot({ path: '.tmp/moments-modal-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(modal.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toBeInViewport();
    expect(await modal.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await modal.screenshot({ path: '.tmp/moments-modal-mobile.png' });
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await acknowledgeSuccess(page, 'Đã lưu ảnh khoảnh khắc.');
    await expect(modal).toHaveCount(0);
    await pencil.click();
    await expect(modal.locator('.moments-editor__asset')).toHaveCount(7);
    await modal.getByRole('button', { name: 'Sửa ảnh', exact: true }).click();
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Ảnh mới được tái sử dụng');
    await expect(preview).toHaveAttribute('data-preview-shape', 'square');
    const loaded = await (await page.request.get('/api/home/moments')).json();
    const updated = loaded.photos.find((photo: { title: string }) => photo.title === 'Ảnh mới được tái sử dụng');
    expect(updated.alt).toBe(updated.title);
    expect(updated.shape).toBe('square');
    await modal.getByRole('button', { name: 'Gỡ ảnh', exact: true }).click();
    await modal.getByRole('button', { name: 'Sắp xếp ảnh', exact: true }).click();
    await modal.getByRole('button', { name: 'Xóa khỏi thư viện: Ảnh mới được tái sử dụng', exact: true }).click();
    await expect(modal.locator('.moments-editor__asset')).toHaveCount(6);

    await page.route('**/api/home/moments', route => route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Không lưu được thay đổi.' }) }) : route.continue());
    await modal.getByRole('button', { name: 'Hàng dưới, ô 1: Khoảnh khắc đã cập nhật', exact: true }).click();
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Giữ bản nháp khi lỗi');
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(modal.getByRole('alert')).toContainText('Không lưu được');
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Giữ bản nháp khi lỗi');
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.unroute('**/api/home/moments');
    await expect(modal).toHaveCount(0);
  } finally {
    await database.homeMomentsGallery.deleteMany();
    if (uploaded && /^\/uploads\/thumbnails\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(uploaded)) await unlink(path.join(process.cwd(), 'storage/thumbnails', path.basename(uploaded))).catch(() => {});
  }
});

test('editor keeps placement and details visible while only the library scrolls', async ({ page, fixture, database }) => {
  try {
    const photos = Array.from({ length: 40 }, (_, index) => ({ ...defaultMoments[index % 6], id: `layout-${index}`, title: `Ảnh thư viện ${index + 1}`, slot: index < 12 ? index : null, visible: index < 12 }));
    await database.homeMomentsGallery.upsert({ where: { id: 'home' }, create: { id: 'home', photos }, update: { photos } });
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc' }).click();
    const modal = page.getByRole('dialog', { name: 'Chỉnh sửa khoảnh khắc' });
    await expect(modal).toBeVisible();
    for (const slot of await modal.locator('.moments-editor__slot').all()) await expect(slot).toBeInViewport();
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toBeInViewport();
    await expect(modal.getByRole('combobox', { name: 'Khung ảnh', exact: true })).toBeInViewport();
    await expect(modal.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toBeInViewport();
    expect(await modal.locator('.moments-editor__asset').first().evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(80);
    await modal.locator('.moments-editor__library-grid').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(modal.getByRole('button', { name: 'Chọn ảnh: Ảnh thư viện 40', exact: true })).toBeInViewport();
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toBeInViewport();
    for (const slot of await modal.locator('.moments-editor__slot').all()) await expect(slot).toBeInViewport();
    await modal.screenshot({ path: '.tmp/moments-workspace-desktop.png' });

    await page.setViewportSize({ width: 390, height: 844 });
    await modal.getByRole('button', { name: 'Sắp xếp ảnh', exact: true }).click();
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toBeHidden();
    await modal.getByRole('button', { name: 'Hàng trên, ô 1: Ảnh thư viện 1', exact: true }).click();
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toBeInViewport();
    await expect(modal.getByRole('button', { name: 'Sửa ảnh', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(modal.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toBeInViewport();
    expect(await modal.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await modal.screenshot({ path: '.tmp/moments-workspace-mobile.png' });
    await page.setViewportSize({ width: 667, height: 375 });
    await modal.getByRole('button', { name: 'Sắp xếp ảnh', exact: true }).click();
    const uploadButton = modal.getByRole('button', { name: 'Tải ảnh mới', exact: true });
    await uploadButton.scrollIntoViewIfNeeded();
    await expect(uploadButton).toBeInViewport();
    await modal.getByRole('button', { name: 'Chọn ảnh: Ảnh thư viện 40', exact: true }).click();
    await expect(modal.getByRole('button', { name: 'Sửa ảnh', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Sửa ảnh trên màn hình thấp');
    await expect(modal.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toBeInViewport();
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
  } finally { await database.homeMomentsGallery.deleteMany(); }
});

test('rows independently hide, stand still or move according to their own photo counts', async ({ page, database }) => {
  try {
    for (const count of [0, 1, 2, 3, 6]) {
      const photos = defaultMoments.map((photo, index) => ({ ...photo, visible: index < count, slot: index < count ? index + 6 : null }));
      await database.homeMomentsGallery.upsert({ where: { id: 'home' }, create: { id: 'home', photos }, update: { photos } });
      await page.goto('/');
      await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
      await expect(page.locator('.moments-wall')).toBeVisible();
      await expect(page.locator('.moments-lane[data-row="0"]')).toHaveCount(0);
      const row = page.locator('.moments-lane[data-row="1"]');
      if (!count) { await expect(row).toHaveCount(0); continue; }
      await expect(row).toHaveAttribute('data-motion', String(count >= 3));
      await expect(row.locator('.moments-track')).toHaveCSS('animation-name', count >= 3 ? 'moments-drift' : 'none');
      await expect(row.locator('.moments-group:not([aria-hidden]) .moment-photo')).toHaveCount(count);
    }
  } finally { await database.homeMomentsGallery.deleteMany(); }
});

test('visitors cannot open or save the moments editor', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.moments-wall')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc' })).toHaveCount(0);
  const response = await page.request.put('/api/home/moments', { data: { version: 0, photos: [] } });
  expect(response.status()).toBe(403);
});
