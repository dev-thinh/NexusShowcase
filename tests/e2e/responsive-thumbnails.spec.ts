import { expect, login, test } from './fixtures';

test('wide thumbnails fill standard frames and signed-in navigation stays on one row at intermediate widths', async ({ page, database, fixture }) => {
  test.setTimeout(60_000);
  const original = await database.showcaseItem.findFirstOrThrow({ where: { isPinned: true } });
  const src = '/uploads/thumbnails/responsive-wide-logo.png';
  await page.route('**/uploads/thumbnails/responsive-wide-logo.png*', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160"><rect width="800" height="160" fill="#153d67"/><text x="20" y="100" font-size="60" fill="white">Robotics and IoT Club</text></svg>' }));
  await database.showcaseItem.update({ where: { id: original.id }, data: { thumbnailUrl: src } });
  try {
    await login(page, fixture.users[0], '/');
    for (const width of [320, 390, 640, 768, 1024, 1100, 1279, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/');
      const header = page.locator('#site-navbar');
      expect((await header.boundingBox())!.height).toBeLessThan(80);
      const toggle = header.locator('.site-mobile-menu-toggle');
      if (width < 1280) {
        await expect(toggle).toBeVisible();
        await expect(header.getByRole('navigation', { name: 'Điều hướng chính', exact: true })).toBeHidden();
      } else {
        await expect(toggle).toBeHidden();
        const navigation = (await header.getByRole('navigation', { name: 'Điều hướng chính', exact: true }).boundingBox())!;
        const brandBox = (await header.locator('.site-brand').boundingBox())!;
        const accountBox = (await header.getByRole('button', { name: /^Menu tài khoản:/ }).boundingBox())!;
        expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(navigation.x);
        expect(navigation.x + navigation.width).toBeLessThanOrEqual(accountBox.x);
      }
      const account = header.getByRole('button', { name: /^Menu tài khoản:/ });
      const brand = header.locator('.site-brand');
      const boxes = await Promise.all([account.boundingBox(), brand.boundingBox()]);
      expect(Math.abs(boxes[0]!.y + boxes[0]!.height / 2 - boxes[1]!.y - boxes[1]!.height / 2)).toBeLessThan(1);
      const section = page.locator('[data-deferred-section="featured"]');
      await section.scrollIntoViewIfNeeded();
      const image = section.locator(`img[src^="${src}"]`);
      await expect(image).toBeVisible();
      await expect(image).toHaveCSS('object-fit', 'cover');
      const frame = section.locator('.home-featured-image-frame').first();
      await expect.poll(async () => {
        const bounds = (await frame.boundingBox())!;
        return bounds.width / bounds.height;
      }).toBeCloseTo(4 / 3, 2);
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight)).toBeCloseTo(5, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 1100) await page.screenshot({ path: '/tmp/nexus-responsive-1100.png' });
    }
  } finally { await database.showcaseItem.update({ where: { id: original.id }, data: { thumbnailUrl: original.thumbnailUrl } }); }
});
