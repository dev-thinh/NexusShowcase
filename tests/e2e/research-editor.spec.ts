import { fixtureImage, defaultResearchImages } from '../fixtures/moments';
import { expect, login, seedPhotoGalleries, test } from './fixtures';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

test('research photos use the shared modal with cancel, save and mobile editing', async ({ page, fixture, database }) => {
  await seedPhotoGalleries(database);
  try {
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    const section = page.locator('[data-deferred-section="research"]');
    await section.scrollIntoViewIfNeeded();
    const edit = page.getByRole('button', { name: 'Chỉnh sửa ảnh hướng nghiên cứu' });
    await edit.click();
    const modal = page.getByRole('dialog', { name: 'Chỉnh sửa ảnh hướng nghiên cứu' });
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-moment-slot]')).toHaveCount(3);
    await expect(section.locator('input')).toHaveCount(0);
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Bản nháp hủy');
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(modal).toHaveCount(0);
    await expect(edit).toBeFocused();
    expect((await database.homeMomentsGallery.findUniqueOrThrow({ where: { id: 'research' } })).photos).toEqual(defaultResearchImages);
    await edit.click();
    await modal.getByLabel('Tiêu đề', { exact: true }).fill('Ảnh nghiên cứu đã lưu');
    await modal.getByRole('button', { name: 'Đưa ảnh sang phải' }).click();
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(modal).toHaveCount(0);
    await expect(section.locator('.research-direction img').nth(1)).toHaveAttribute('alt', 'Ảnh nghiên cứu đã lưu');
    expect((await (await page.request.get('/api/home/research')).json()).photos).toHaveLength(3);
    await page.setViewportSize({ width: 390, height: 844 });
    await edit.click();
    await expect(modal).toBeVisible();
    await modal.locator('[data-moment-slot="1"]').click();
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Ảnh nghiên cứu đã lưu');
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(modal).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await edit.click();
    const beforeRemoval = await (await page.request.get('/api/home/research')).json();
    await modal.locator('[data-moment-slot="0"]').click();
    await modal.getByRole('button', { name: 'Gỡ ảnh', exact: true }).click();
    await expect(modal.locator('[data-moment-slot="0"] img')).toHaveCount(0);
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(modal).toHaveCount(0);
    await expect(section.locator('.research-direction').nth(0).locator('[data-media-placeholder]')).toHaveCount(1);
    const afterRemoval = await (await page.request.get('/api/home/research')).json();
    expect(afterRemoval.photos.map((photo: { slot: number }) => photo.slot)).toEqual([1, 2]);
    expect(afterRemoval.library.photos.some((photo: { src: string }) => photo.src === beforeRemoval.photos[0].src)).toBe(true);
    await edit.click();
    await expect(modal.locator('[data-moment-slot="0"] img')).toHaveCount(0);
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(modal).toHaveCount(0);
  } finally { await database.homeMomentsGallery.deleteMany({ where: { id: 'research' } }); }
});

test('both editors share uploaded photos without changing each other’s placements', async ({ page, fixture, database }) => {
  test.setTimeout(90_000);
  const uploads: string[] = [];
  await database.homeMomentsGallery.deleteMany();
  await seedPhotoGalleries(database);
  try {
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    await page.locator('[data-deferred-section="research"]').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Chỉnh sửa ảnh hướng nghiên cứu' }).click();
    const research = page.getByRole('dialog', { name: 'Chỉnh sửa ảnh hướng nghiên cứu' });
    await expect(research.locator('.moments-editor__asset')).toHaveCount(6);
    const original = (await (await page.request.get('/api/home/moments')).json()).photos;
    await research.getByRole('button', { name: `Chọn ảnh: ${original[0].title}`, exact: true }).click();
    await expect(research.locator('[data-moment-slot="0"] img')).toHaveAttribute('src', original[0].src);
    const buffer = fixtureImage;
    const upload = async (modal: typeof research, name: string) => {
      const pending = page.waitForResponse(response => response.url().endsWith('/api/upload') && response.request().method() === 'POST');
      await modal.getByLabel('Tải ảnh mới vào thư viện').setInputFiles({ name: `${name}.png`, mimeType: 'image/png', buffer });
      const result = await pending;
      expect(result.ok()).toBe(true);
      const src = (await result.json()).url as string;
      uploads.push(src);
      await expect(modal.getByRole('button', { name: `Chọn ảnh: ${name}`, exact: true })).toBeVisible();
      return src;
    };
    const firstUpload = await upload(research, 'shared-research-upload');
    await research.getByRole('button', { name: 'Chọn ảnh: shared-research-upload', exact: true }).click();
    await research.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(research).toHaveCount(0);
    const afterResearch = await (await page.request.get('/api/home/moments')).json();
    expect(afterResearch.photos.filter((photo: { slot: number | null }) => photo.slot !== null)).toEqual(original.filter((photo: { slot: number | null }) => photo.slot !== null));
    expect(afterResearch.photos.find((photo: { src: string }) => photo.src === firstUpload).slot).toBeNull();
    const stale = await (await page.request.get('/api/home/research')).json();
    expect(stale.photos[0].src).toBe(firstUpload);
    // The server also protects references if a client bypasses disabled controls.
    const removed = { version: afterResearch.version, photos: afterResearch.photos.filter((photo: { src: string }) => photo.src !== firstUpload) };
    expect((await page.request.put('/api/home/moments', { data: removed })).status()).toBe(400);
    expect((await (await page.request.get('/api/home/moments')).json()).version).toBe(afterResearch.version);

    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc' }).click();
    const moments = page.getByRole('dialog', { name: 'Chỉnh sửa khoảnh khắc' });
    await expect(moments.getByRole('button', { name: 'Xóa khỏi thư viện: shared-research-upload', exact: true })).toBeDisabled();
    const secondUpload = await upload(moments, 'shared-moments-upload');
    await moments.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(moments).toHaveCount(0);
    expect((await page.request.put('/api/home/research', { data: stale })).status()).toBe(409);
    expect((await (await page.request.get('/api/home/research')).json()).version).toBe(stale.version);

    await page.locator('[data-deferred-section="research"]').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Chỉnh sửa ảnh hướng nghiên cứu' }).click();
    await expect(research.getByRole('button', { name: 'Chọn ảnh: shared-moments-upload', exact: true })).toBeVisible();
    await research.getByRole('button', { name: 'Chọn ảnh: shared-moments-upload', exact: true }).click();
    await research.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(research).toHaveCount(0);
    const result = await (await page.request.get('/api/home/research')).json();
    expect(result.photos).toHaveLength(3);
    expect(result.photos[0].src).toBe(secondUpload);
  } finally {
    await database.homeMomentsGallery.deleteMany();
    for (const src of uploads) await unlink(path.join(process.cwd(), 'public', src)).catch(() => {});
  }
});
