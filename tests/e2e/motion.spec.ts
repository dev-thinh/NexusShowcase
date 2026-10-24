import { expect, login, test } from './fixtures';

test('page navigation and scroll entries animate, and modal close waits for its exit', async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    const durations: number[] = [];
    Object.assign(window, { motionDurations: durations });
    Element.prototype.animate = function (frames, options) {
      durations.push(typeof options === 'number' ? options : Number(options?.duration ?? 0));
      return animate.call(this, frames, options);
    };
  });
  await page.goto('/');
  await page.locator('nav a[href="/members"]').first().click();
  await expect(page).toHaveURL(/\/members$/);
  await expect.poll(() => page.evaluate(() => (window as unknown as { motionDurations: number[] }).motionDurations)).toContain(260);
  await expect.poll(() => page.evaluate(() => (window as unknown as { motionDurations: number[] }).motionDurations)).toContain(400);
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  // Use the accessible photo buttons regardless of presentation class names.
  const trigger = page.locator('.moments-wall button[aria-label^="Xem ảnh:"]').first();
  await expect(trigger).toBeVisible();
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.locator('.moments-lane').first().hover();
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS('animation-name', 'ui-modal-in');
    const remainsDuringExit = await page.getByRole('button', { name: 'Đóng hộp thoại' }).evaluate(button => {
      (button as HTMLButtonElement).click();
      return document.querySelector('[role="dialog"]') !== null;
    });
    expect(remainsDuringExit).toBe(true);
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect(trigger).toBeFocused();
  }
});

test('member management dialogs share the animation and release the scroll lock', async ({ page, fixture }) => {
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/admin/members');
  await page.getByRole('button', { name: /^Xóa tài khoản / }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('animation-name', 'ui-modal-in');
  await dialog.getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
