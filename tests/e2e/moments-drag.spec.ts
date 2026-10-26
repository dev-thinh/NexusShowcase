import { acknowledgeSuccess, expect, login, seedPhotoGalleries, test } from './fixtures';
import { defaultMoments } from '../fixtures/moments';
import type { Locator, Page } from '@playwright/test';

async function dragPhoto(page: Page, source: Locator, target: Locator) {
  // Measure the grab point after the dialog's entrance transform settles,
  // as the touch scenario already does before dispatching its first gesture.
  await source.evaluate(async element => {
    const dialog = element.closest('[role="dialog"]');
    await Promise.all((dialog?.getAnimations() ?? []).map(animation => animation.finished));
  });
  await source.scrollIntoViewIfNeeded();
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  const offset = { x: from.width * 0.3, y: from.height * 0.65 };
  await page.mouse.move(from.x + offset.x, from.y + offset.y);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await expect(page.locator('.moments-drag-preview')).toBeVisible();
  await expect.poll(async () => {
    const ghost = (await page.locator('.moments-drag-preview').boundingBox())!;
    return Math.max(
      Math.abs(ghost.x - (to.x + to.width / 2 - offset.x)),
      Math.abs(ghost.y - (to.y + to.height / 2 - offset.y)),
      Math.abs(ghost.width - from.width), Math.abs(ghost.height - from.height),
    );
  }).toBeLessThan(2);
  await expect(target).toHaveAttribute('data-drop-target', 'true');
  await page.mouse.up();
  await expect(page.locator('.moments-drag-preview')).toHaveCount(0);
}

test('mouse drags swap, move across rows and place library images, then persist only on Save', async ({ page, fixture, database }) => {
  await seedPhotoGalleries(database);
  try {
    const extra = { ...defaultMoments[0], id: 'library-unused', title: 'Ảnh chờ sử dụng', slot: null, visible: false };
    await database.homeMomentsGallery.upsert({ where: { id: 'home' }, create: { id: 'home', photos: [...defaultMoments, extra] }, update: { photos: [...defaultMoments, extra] } });
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    const pencil = page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc' });
    await pencil.click();
    const modal = page.getByRole('dialog', { name: 'Chỉnh sửa khoảnh khắc' });
    const slot = (index: number) => modal.locator(`[data-moment-slot="${index}"]`);
    await dragPhoto(page, slot(0), slot(1));
    await expect(slot(0)).toHaveAttribute('data-moment-drag', defaultMoments[1].id);
    await expect(slot(1)).toHaveAttribute('data-moment-drag', defaultMoments[0].id);
    await dragPhoto(page, slot(1), slot(6));
    await expect(slot(1)).not.toHaveAttribute('data-moment-drag');
    await expect(slot(6)).toHaveAttribute('data-moment-drag', defaultMoments[0].id);
    await dragPhoto(page, modal.locator('.moments-editor__asset-select[data-moment-drag="library-unused"]'), slot(0));
    await expect(slot(0)).toHaveAttribute('data-moment-drag', extra.id);
    // This photo still appears in Research, even after removing its moments slot.
    await expect(modal.getByRole('button', { name: `Xóa khỏi thư viện: ${defaultMoments[1].title}`, exact: true })).toBeDisabled();

    // Escape cancels only the drag, preserving the open editor.
    const from = (await slot(0).boundingBox())!;
    const to = (await slot(2).boundingBox())!;
    await page.mouse.move(from.x + 20, from.y + 20); await page.mouse.down();
    await page.mouse.move(to.x + 20, to.y + 20, { steps: 8 });
    await expect(page.locator('.moments-drag-preview')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.moments-drag-preview')).toHaveCount(0);
    await page.mouse.up();
    await expect(modal).toBeVisible();
    await expect(slot(0)).toHaveAttribute('data-moment-drag', extra.id);
    await expect(slot(2)).toHaveAttribute('data-moment-drag', defaultMoments[2].id);
    await page.mouse.move(from.x + 20, from.y + 20); await page.mouse.down();
    await page.mouse.move(4, 4, { steps: 8 });
    await expect(page.locator('.moments-drag-preview')).toBeVisible();
    await page.mouse.up();
    await expect(slot(0)).toHaveAttribute('data-moment-drag', extra.id);
    const unchanged = await database.homeMomentsGallery.findUniqueOrThrow({ where: { id: 'home' } });
    expect((unchanged.photos as Array<{ id: string; slot: number | null }>).find(photo => photo.id === extra.id)?.slot).toBeNull();
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await acknowledgeSuccess(page, 'Đã lưu ảnh khoảnh khắc.');
    await expect(modal).toHaveCount(0);
    await pencil.click();
    await expect(slot(0)).toHaveAttribute('data-moment-drag', extra.id);
    await expect(slot(6)).toHaveAttribute('data-moment-drag', defaultMoments[0].id);
    await dragPhoto(page, slot(0), slot(7));
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(modal).toHaveCount(0);
    await pencil.click();
    await expect(slot(0)).toHaveAttribute('data-moment-drag', extra.id);
    await expect(slot(7)).not.toHaveAttribute('data-moment-drag');
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
  } finally { await database.homeMomentsGallery.deleteMany(); }
});

test('touch hold drags an image into another row while taps still open its details', async ({ browser, fixture, database }) => {
  const context = await browser.newContext({ baseURL: process.env.HARNESS_BASE_URL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await seedPhotoGalleries(database);
  try {
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc' }).tap();
    const modal = page.getByRole('dialog', { name: 'Chỉnh sửa khoảnh khắc' });
    const source = modal.locator('[data-moment-slot="0"]');
    const target = modal.locator('[data-moment-slot="6"]');
    await expect(source).toBeVisible();
    // Capture the grab point after the modal's entrance transform settles.
    await modal.evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); });
    const from = (await source.boundingBox())!;
    const to = (await target.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x + from.width / 2, y: from.y + from.height / 2 }] });
    await expect(page.locator('.moments-drag-preview')).toBeVisible();
    const ghost = (await page.locator('.moments-drag-preview').boundingBox())!;
    expect(Math.abs(ghost.x - from.x)).toBeLessThan(2);
    expect(Math.abs(ghost.y - from.y)).toBeLessThan(2);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to.x + to.width / 2, y: to.y + to.height / 2 }] });
    await expect(target).toHaveAttribute('data-drop-target', 'true');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(target).toHaveAttribute('data-moment-drag', defaultMoments[0].id);
    await expect(source).not.toHaveAttribute('data-moment-drag');
    await expect(modal.getByRole('button', { name: 'Sắp xếp ảnh', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await target.tap();
    await expect(modal.getByRole('button', { name: 'Sửa ảnh', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(modal.getByLabel('Tiêu đề', { exact: true })).toHaveValue(defaultMoments[0].title);
    await modal.getByRole('button', { name: 'Hủy', exact: true }).tap();
    await expect(modal).toHaveCount(0);
    await cdp.detach();
  } finally { await context.close(); await database.homeMomentsGallery.deleteMany(); }
});
