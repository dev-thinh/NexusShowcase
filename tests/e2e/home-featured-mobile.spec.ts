import { expect, login, seedPhotoGalleries, test } from './fixtures';

for (const width of [320, 390]) test(`home cards stay compact and section actions align right at ${width}px`, async ({ page, fixture, database }) => {
  await seedPhotoGalleries(database);
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/');
  const section = page.locator('.home-featured');
  await section.scrollIntoViewIfNeeded();
  const card = section.locator('article').first();
  await expect(card).toBeVisible();
  const photo = card.getByRole('link', { name: /^Xem công trình:/ });
  expect((await photo.boundingBox())!.height).toBeLessThan(200);
  const admin = card.locator('.home-featured-admin');
  const metadata = card.locator('.home-featured-meta');
  const metaBox = (await metadata.boundingBox())!;
  const adminBox = (await admin.boundingBox())!;
  expect(adminBox.y).toBeGreaterThanOrEqual(metaBox.y);
  expect(adminBox.y + adminBox.height).toBeLessThanOrEqual(metaBox.y + metaBox.height + 1);
  await expect(admin.getByRole('switch').locator('span').first()).toBeHidden();
  expect(await metadata.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await card.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await card.screenshot({ path: `/tmp/nexus-mobile-audit/featured-${width}.png` });
  for (const [parent, action] of [
    [section, section.getByRole('link', { name: 'Xem tất cả công trình', exact: true })],
    [page.locator('.members-band'), page.getByRole('link', { name: 'Xem tất cả thành viên', exact: true })],
  ] as const) {
    const heading = parent.locator('.home-section-heading');
    const row = heading.locator('..');
    const rowBox = (await row.boundingBox())!;
    const actionBox = (await action.boundingBox())!;
    expect(Math.abs(rowBox.x + rowBox.width - actionBox.x - actionBox.width)).toBeLessThan(2);
  }
  for (const name of ['Chỉnh sửa ảnh khoảnh khắc', 'Chỉnh sửa ảnh hướng nghiên cứu']) {
    const button = page.getByRole('button', { name, exact: true });
    await page.locator(`[data-deferred-section="${name.includes('hướng') ? 'research' : 'moments'}"]`).scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    const bounds = (await button.locator('..').boundingBox())!;
    expect(bounds.x + bounds.width).toBeGreaterThan(width - 65);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
